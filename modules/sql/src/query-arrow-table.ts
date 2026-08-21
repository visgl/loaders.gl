// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';

import type {
  SQLComparisonPredicate,
  SQLInPredicate,
  SQLLogicalPredicate,
  SQLNotPredicate,
  SQLNullPredicate,
  SQLPredicate,
  SQLPredicateValue
} from './sql-predicate-types';

/** Options for the lightweight in-memory Arrow query executor. */
export type ArrowQueryOptions = Readonly<{
  /** Filters source rows using the portable SQL predicate representation. */
  predicate?: SQLPredicate;
  /** Selects output columns in the supplied order. Defaults to all source columns. */
  columns?: readonly string[];
  /** Restricts the result to the first matching rows. */
  limit?: number;
  /** Cancels the query before or during predicate evaluation. */
  signal?: AbortSignal;
}>;

type SQLTruthValue = boolean | null;

/**
 * Executes a small, Arrow-native query over one in-memory table.
 *
 * The proof of concept supports portable predicates, column projection, and limits. Projection
 * and limits without a predicate preserve Arrow's zero-copy views. Predicate evaluation is
 * currently row-oriented and materializes the matching result rows; later physical operators can
 * replace this implementation with vectorized selection handling without changing this API.
 */
export function queryArrowTable(
  sourceTable: ArrowTable,
  options: ArrowQueryOptions = {}
): ArrowTable {
  validateArrowQueryOptions(options);
  throwIfAborted(options.signal);

  const sourceData = sourceTable.data;
  const columnNames = getOutputColumnNames(sourceData, options.columns);
  const predicateColumnNames = options.predicate ? getPredicateColumnNames(options.predicate) : [];
  validateColumnNames(sourceData, columnNames);
  validateColumnNames(sourceData, predicateColumnNames);

  const projectedData = sourceData.select(columnNames);
  const limit = options.limit ?? Number.POSITIVE_INFINITY;
  if (!options.predicate) {
    return wrapArrowTable(projectedData.slice(0, limit));
  }

  const predicateColumns = getPredicateColumns(sourceData, predicateColumnNames);
  const matchingRowIndices: number[] = [];
  for (let rowIndex = 0; rowIndex < sourceData.numRows && matchingRowIndices.length < limit; rowIndex++) {
    throwIfAborted(options.signal);
    if (evaluatePredicate(options.predicate, predicateColumns, rowIndex) === true) {
      matchingRowIndices.push(rowIndex);
    }
  }

  if (matchingRowIndices.length === 0) {
    return wrapArrowTable(projectedData.slice(0, 0));
  }

  const outputColumns: Record<string, arrow.Vector> = {};
  for (const field of projectedData.schema.fields) {
    const sourceColumn = projectedData.getChild(field.name);
    if (!sourceColumn) {
      throw new Error(`Arrow query could not read column "${field.name}".`);
    }
    const values = matchingRowIndices.map(rowIndex => sourceColumn.get(rowIndex));
    outputColumns[field.name] = arrow.vectorFromArray(values, sourceColumn.type);
  }
  return wrapArrowTable(new arrow.Table(projectedData.schema, outputColumns));
}

/** Returns requested output columns, defaulting to all source columns. */
function getOutputColumnNames(
  sourceTable: arrow.Table,
  requestedColumnNames: readonly string[] | undefined
): string[] {
  if (requestedColumnNames === undefined) {
    return sourceTable.schema.fields.map(field => field.name);
  }
  return [...requestedColumnNames];
}

/** Validates public query options before any table processing begins. */
function validateArrowQueryOptions(options: ArrowQueryOptions): void {
  if (
    options.limit !== undefined &&
    (!Number.isSafeInteger(options.limit) || options.limit < 0)
  ) {
    throw new Error('Arrow query limit must be a non-negative safe integer.');
  }
}

/** Validates that every selected or predicate-referenced column exists exactly once. */
function validateColumnNames(sourceTable: arrow.Table, columnNames: readonly string[]): void {
  const availableColumnNames = new Set(sourceTable.schema.fields.map(field => field.name));
  const seenColumnNames = new Set<string>();
  for (const columnName of columnNames) {
    if (!availableColumnNames.has(columnName)) {
      throw new Error(`Arrow query column not found: ${columnName}`);
    }
    if (seenColumnNames.has(columnName)) {
      throw new Error(`Arrow query column was selected more than once: ${columnName}`);
    }
    seenColumnNames.add(columnName);
  }
}

/** Creates a predicate-column lookup so values are not resolved for every source row. */
function getPredicateColumns(
  sourceTable: arrow.Table,
  columnNames: readonly string[]
): Readonly<Record<string, arrow.Vector>> {
  const columns: Record<string, arrow.Vector> = {};
  for (const columnName of columnNames) {
    const column = sourceTable.getChild(columnName);
    if (!column) {
      throw new Error(`Arrow query column not found: ${columnName}`);
    }
    columns[columnName] = column;
  }
  return columns;
}

/** Collects each column property referenced by a portable predicate exactly once. */
function getPredicateColumnNames(predicate: SQLPredicate): string[] {
  const columnNames = new Set<string>();
  visitPredicate(predicate, currentPredicate => {
    if (isLogicalPredicate(currentPredicate) || isNotPredicate(currentPredicate)) {
      return;
    }
    columnNames.add(currentPredicate.args[0].property);
  });
  return [...columnNames];
}

/** Evaluates a predicate against one Arrow table row using SQL three-valued Boolean logic. */
function evaluatePredicate(
  predicate: SQLPredicate,
  columns: Readonly<Record<string, arrow.Vector>>,
  rowIndex: number
): SQLTruthValue {
  if (isLogicalPredicate(predicate)) {
    const values = predicate.args.map(child => evaluatePredicate(child, columns, rowIndex));
    return predicate.op === 'and' ? evaluateAnd(values) : evaluateOr(values);
  }
  if (isNotPredicate(predicate)) {
    const value = evaluatePredicate(predicate.args[0], columns, rowIndex);
    return value === null ? null : !value;
  }

  const value = getColumnValue(columns, predicate.args[0].property, rowIndex);
  if (isNullPredicate(predicate)) {
    return value === null;
  }
  if (isInPredicate(predicate)) {
    return evaluateIn(value, predicate.args[1]);
  }
  return evaluateComparison(value, predicate);
}

/** Returns the value of one predicate column or raises an internal invariant error. */
function getColumnValue(
  columns: Readonly<Record<string, arrow.Vector>>,
  columnName: string,
  rowIndex: number
): unknown {
  const column = columns[columnName];
  if (!column) {
    throw new Error(`Arrow query could not read predicate column "${columnName}".`);
  }
  return column.get(rowIndex);
}

/** Evaluates SQL AND with null propagation. */
function evaluateAnd(values: readonly SQLTruthValue[]): SQLTruthValue {
  if (values.includes(false)) {
    return false;
  }
  return values.includes(null) ? null : true;
}

/** Evaluates SQL OR with null propagation. */
function evaluateOr(values: readonly SQLTruthValue[]): SQLTruthValue {
  if (values.includes(true)) {
    return true;
  }
  return values.includes(null) ? null : false;
}

/** Evaluates a membership expression with SQL null propagation. */
function evaluateIn(value: unknown, candidates: readonly SQLPredicateValue[]): SQLTruthValue {
  if (value === null || value === undefined) {
    return null;
  }
  for (const candidate of candidates) {
    if (compareValues(value, candidate) === 0) {
      return true;
    }
  }
  return false;
}

/** Evaluates a binary SQL comparison with SQL null propagation. */
function evaluateComparison(
  value: unknown,
  predicate: SQLComparisonPredicate
): SQLTruthValue {
  if (value === null || value === undefined) {
    return null;
  }
  const comparison = compareValues(value, predicate.args[1]);
  switch (predicate.op) {
    case '=':
      return comparison === 0;
    case '<>':
      return comparison !== 0;
    case '<':
      return comparison < 0;
    case '<=':
      return comparison <= 0;
    case '>':
      return comparison > 0;
    case '>=':
      return comparison >= 0;
  }
}

/** Compares supported predicate values and rejects comparisons without an unambiguous ordering. */
function compareValues(left: unknown, right: SQLPredicateValue): number {
  if (left instanceof Date && right instanceof Date) {
    return compareNumbers(left.getTime(), right.getTime());
  }
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return compareBinary(left, right);
  }
  if (typeof left === 'bigint' && typeof right === 'bigint') {
    return left === right ? 0 : left < right ? -1 : 1;
  }
  if (typeof left === 'bigint' && typeof right === 'number' && Number.isSafeInteger(right)) {
    return compareValues(left, BigInt(right));
  }
  if (typeof left === 'number' && typeof right === 'bigint' && Number.isSafeInteger(left)) {
    return compareValues(BigInt(left), right);
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return compareNumbers(left, right);
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return left === right ? 0 : left < right ? -1 : 1;
  }
  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }
  throw new Error(
    `Arrow query cannot compare ${getValueType(left)} with ${getValueType(right)} values.`
  );
}

/** Compares two finite number values. */
function compareNumbers(left: number, right: number): number {
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    throw new Error('Arrow query cannot compare non-finite numbers.');
  }
  return left === right ? 0 : left < right ? -1 : 1;
}

/** Compares binary values lexicographically. */
function compareBinary(left: Uint8Array, right: Uint8Array): number {
  const commonLength = Math.min(left.length, right.length);
  for (let index = 0; index < commonLength; index++) {
    if (left[index] !== right[index]) {
      return left[index] < right[index] ? -1 : 1;
    }
  }
  return left.length === right.length ? 0 : left.length < right.length ? -1 : 1;
}

/** Returns a human-readable type name for predicate diagnostics. */
function getValueType(value: unknown): string {
  if (value instanceof Date) {
    return 'Date';
  }
  if (value instanceof Uint8Array) {
    return 'Uint8Array';
  }
  return typeof value;
}

/** Recursively visits the predicate tree depth-first. */
function visitPredicate(predicate: SQLPredicate, visit: (predicate: SQLPredicate) => void): void {
  visit(predicate);
  if (isLogicalPredicate(predicate) || isNotPredicate(predicate)) {
    for (const child of predicate.args) {
      visitPredicate(child, visit);
    }
  }
}

/** Returns whether the predicate combines two or more child predicates. */
function isLogicalPredicate(predicate: SQLPredicate): predicate is SQLLogicalPredicate {
  return predicate.op === 'and' || predicate.op === 'or';
}

/** Returns whether the predicate negates one child predicate. */
function isNotPredicate(predicate: SQLPredicate): predicate is SQLNotPredicate {
  return predicate.op === 'not';
}

/** Returns whether the predicate tests a column for null values. */
function isNullPredicate(predicate: SQLPredicate): predicate is SQLNullPredicate {
  return predicate.op === 'isNull';
}

/** Returns whether the predicate tests a column against several values. */
function isInPredicate(predicate: SQLPredicate): predicate is SQLInPredicate {
  return predicate.op === 'in';
}

/** Throws a standard cancellation error if a caller has aborted the query. */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    const error = new Error('Arrow query was aborted.');
    error.name = 'AbortError';
    throw error;
  }
}

/** Wraps an Arrow table with the loaders.gl Arrow-table shape and converted schema. */
function wrapArrowTable(data: arrow.Table): ArrowTable {
  return {
    shape: 'arrow-table',
    schema: convertArrowToSchema(data.schema),
    data
  };
}
