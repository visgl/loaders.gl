// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  getColumnarPredicateColumns,
  validateColumnarPredicate,
  isColumnarPredicateParameter as isSQLPredicateParameter,
  type ColumnarPredicate,
  type ColumnarPredicateInputValue as SQLPredicateValue,
  type ColumnarComparisonPredicate,
  type ColumnarLogicalPredicate,
  type ColumnarNotPredicate,
  type ColumnarNullPredicate,
  type ColumnarInPredicate
} from '@loaders.gl/core/loader-utils';

type SQLPredicate = ColumnarPredicate<SQLPredicateValue>;
type SQLComparisonPredicate = ColumnarComparisonPredicate<SQLPredicateValue>;
type SQLLogicalPredicate = ColumnarLogicalPredicate<SQLPredicateValue>;
type SQLNotPredicate = ColumnarNotPredicate<SQLPredicateValue>;
type SQLNullPredicate = ColumnarNullPredicate;
type SQLInPredicate = ColumnarInPredicate<SQLPredicateValue>;
type SQLTruthValue = boolean | null;

/** Controls residual filtering of one Arrow input. */
export type ArrowFilterOptions = Readonly<{
  /** Stops after retaining this many rows, in source order. */
  limit?: number;
  /** Cooperatively cancels predicate evaluation. */
  signal?: AbortSignal;
}>;

/** Filters record batches independently while preserving source schema and batch metadata. */
export function filterArrowTable(
  source: arrow.Table,
  predicate: ColumnarPredicate<unknown>,
  options: ArrowFilterOptions = {}
): arrow.Table {
  validateColumnarPredicate(predicate, new Set(source.schema.fields.map(field => field.name)));
  let remaining = options.limit ?? Infinity;
  if (remaining !== Infinity && (!Number.isSafeInteger(remaining) || remaining < 0)) {
    throw new Error('Arrow filter limit must be a non-negative safe integer.');
  }
  options.signal?.throwIfAborted();
  const batches: arrow.RecordBatch[] = [];
  for (const batch of source.batches) {
    if (remaining === 0) break;
    options.signal?.throwIfAborted();
    const data = new arrow.Table(source.schema, [batch]);
    const columns = getPredicateColumns(data, getColumnarPredicateColumns(predicate));
    const indices: number[] = [];
    for (let rowIndex = 0; rowIndex < batch.numRows && indices.length < remaining; rowIndex++) {
      options.signal?.throwIfAborted();
      if (evaluatePredicate(predicate as SQLPredicate, columns, rowIndex) === true)
        indices.push(rowIndex);
    }
    remaining -= indices.length;
    if (indices.length === 0) continue;
    if (indices.length === batch.numRows) {
      batches.push(batch);
      continue;
    }
    if (indices[indices.length - 1] - indices[0] + 1 === indices.length) {
      batches.push(batch.slice(indices[0], indices[indices.length - 1] + 1));
      continue;
    }
    const vectors = Object.fromEntries(
      source.schema.fields.map(field => {
        const vector = data.getChild(field.name)!;
        return [
          field.name,
          arrow.vectorFromArray(
            indices.map(index => vector.get(index)),
            field.type
          )
        ];
      })
    );
    const gathered = new arrow.Table(source.schema, vectors);
    batches.push(
      ...gathered.batches.map(
        output => new arrow.RecordBatch(source.schema, output.data, batch.metadata)
      )
    );
  }
  return new arrow.Table(source.schema, batches);
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
  columnName: string | readonly string[],
  rowIndex: number
): unknown {
  const path = typeof columnName === 'string' ? [columnName] : columnName;
  const column = columns[path[0]];
  if (!column) {
    throw new Error(`Arrow query could not read predicate column "${columnName}".`);
  }
  let value: unknown = column.get(rowIndex);
  for (const property of path.slice(1)) {
    if (value === null || value === undefined) return null;
    value = (value as Record<string, unknown>)[property];
  }
  return value;
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
    return compareArrowQueryNumbers(left.getTime(), right.getTime());
  }
  if (typeof left === 'number' && right instanceof Date) {
    return compareArrowQueryNumbers(left, right.getTime());
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
    return compareArrowQueryNumbers(left, right);
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return left === right ? 0 : left < right ? -1 : 1;
  }
  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }
  throw new Error(
    `Arrow query cannot compare ${getArrowQueryValueType(left)} with ${getArrowQueryValueType(right)} values.`
  );
}

/** Compares two finite number values. */
export function compareArrowQueryNumbers(left: number, right: number): number {
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
export function getArrowQueryValueType(value: unknown): string {
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
