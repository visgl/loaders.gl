// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';

import {
  isSQLPredicateParameter,
  type SQLComparisonPredicate,
  type SQLInPredicate,
  type SQLLogicalPredicate,
  type SQLNotPredicate,
  type SQLNullPredicate,
  type SQLPredicate,
  type SQLPredicateValue
} from './sql-predicate-types';
import {
  getSQLPredicateColumnNames,
  planTableQuery,
  type TableQueryFilterStep,
  type TableQueryLimitStep,
  type TableQueryOptions,
  type TableQueryPlanStep,
  type TableQueryProjectStep,
  type TableQueryScanStep
} from './table-query';

/** Options for the lightweight in-memory Arrow query executor. */
export type ArrowQueryOptions = TableQueryOptions &
  Readonly<{
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
  throwIfAborted(options.signal);

  const sourceData = sourceTable.data;
  const plan = planTableQuery(
    sourceData.schema.fields.map(field => field.name),
    options
  );
  const scannedData = sourceData.select([...getScanStep(plan).columns]);
  const projectedData = scannedData.select([...getProjectStep(plan).columns]);
  const predicate = getFilterStep(plan)?.predicate;
  const limit = getLimitStep(plan)?.limit ?? Number.POSITIVE_INFINITY;
  if (!predicate) {
    return wrapArrowTable(projectedData.slice(0, limit));
  }

  const predicateColumns = getPredicateColumns(scannedData, getSQLPredicateColumnNames(predicate));
  const matchingRowIndices: number[] = [];
  for (
    let rowIndex = 0;
    rowIndex < scannedData.numRows && matchingRowIndices.length < limit;
    rowIndex++
  ) {
    throwIfAborted(options.signal);
    if (evaluatePredicate(predicate, predicateColumns, rowIndex) === true) {
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
function evaluateComparison(value: unknown, predicate: SQLComparisonPredicate): SQLTruthValue {
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
  if (isSQLPredicateParameter(right)) {
    throw new Error(
      `Arrow query parameter ":${right.parameter}" must be bound before query execution.`
    );
  }
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

/** Returns the mandatory source scan from a normalized table-query plan. */
function getScanStep(plan: readonly TableQueryPlanStep[]): TableQueryScanStep {
  const step = plan.find((candidate): candidate is TableQueryScanStep => candidate.kind === 'scan');
  if (!step) {
    throw new Error('Arrow query plan is missing a scan step.');
  }
  return step;
}

/** Returns the optional predicate filter from a normalized table-query plan. */
function getFilterStep(plan: readonly TableQueryPlanStep[]): TableQueryFilterStep | undefined {
  return plan.find((candidate): candidate is TableQueryFilterStep => candidate.kind === 'filter');
}

/** Returns the mandatory output projection from a normalized table-query plan. */
function getProjectStep(plan: readonly TableQueryPlanStep[]): TableQueryProjectStep {
  const step = plan.find(
    (candidate): candidate is TableQueryProjectStep => candidate.kind === 'project'
  );
  if (!step) {
    throw new Error('Arrow query plan is missing a project step.');
  }
  return step;
}

/** Returns the optional result limit from a normalized table-query plan. */
function getLimitStep(plan: readonly TableQueryPlanStep[]): TableQueryLimitStep | undefined {
  return plan.find((candidate): candidate is TableQueryLimitStep => candidate.kind === 'limit');
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
