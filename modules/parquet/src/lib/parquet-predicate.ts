// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayType} from '@loaders.gl/schema';

import type {
  ParquetPredicate,
  ParquetPredicateValue,
  ParquetRowGroupMetadata
} from '../parquet-source-types';

/** Returns the unique top-level columns referenced by a predicate. */
export function getParquetPredicateColumns(predicate: ParquetPredicate): string[] {
  const columns = new Set<string>();
  visitParquetPredicate(predicate, child => {
    if ('column' in child) {
      columns.add(child.column);
    }
  });
  return [...columns];
}

/** Copies a predicate tree and mutable scalar values for read-scoped option snapshots. */
export function copyParquetPredicate(predicate: ParquetPredicate): ParquetPredicate {
  if ('predicates' in predicate) {
    return {
      operator: predicate.operator,
      predicates: predicate.predicates.map(copyParquetPredicate)
    };
  }
  if ('values' in predicate) {
    return {
      column: predicate.column,
      operator: predicate.operator,
      values: predicate.values.map(copyPredicateValue)
    };
  }
  if ('value' in predicate) {
    return {
      column: predicate.column,
      operator: predicate.operator,
      value: copyPredicateValue(predicate.value)
    };
  }
  return {...predicate};
}

/** Validates a predicate and every referenced top-level column. */
export function validateParquetPredicate(
  predicate: ParquetPredicate,
  availableColumns: ReadonlySet<string>
): void {
  visitParquetPredicate(predicate, child => {
    if ('predicates' in child) {
      if (child.predicates.length === 0) {
        throw new Error(
          `Parquet predicate ${child.operator} requires at least one child predicate`
        );
      }
      return;
    }
    if (!availableColumns.has(child.column)) {
      throw new Error(`Parquet predicate column not found: ${child.column}`);
    }
    if ('values' in child && child.values.length === 0) {
      throw new Error('Parquet predicate in requires at least one value');
    }
  });
}

/** Conservatively determines whether a row group can contain a matching row. */
export function canParquetRowGroupMatch(
  predicate: ParquetPredicate,
  rowGroup: ParquetRowGroupMetadata
): boolean {
  if ('predicates' in predicate) {
    return predicate.operator === 'and'
      ? predicate.predicates.every(child => canParquetRowGroupMatch(child, rowGroup))
      : predicate.predicates.some(child => canParquetRowGroupMatch(child, rowGroup));
  }

  const column = rowGroup.columns.find(
    columnChunk => columnChunk.path.length === 1 && columnChunk.path[0] === predicate.column
  );
  const statistics = column?.statistics;
  if (!statistics) {
    return true;
  }
  if (statistics.nullCount === rowGroup.rowCount) {
    return predicate.operator === 'is-null';
  }
  if (predicate.operator === 'is-null') {
    return statistics.nullCount !== 0;
  }
  if (predicate.operator === 'is-not-null') {
    return statistics.nullCount !== rowGroup.rowCount;
  }
  if (predicate.operator === 'in') {
    return predicate.values.some(value =>
      canComparisonMatch(
        '=',
        value,
        statistics.minIsExact === false ? undefined : statistics.min,
        statistics.maxIsExact === false ? undefined : statistics.max
      )
    );
  }
  if ('value' in predicate) {
    return canComparisonMatch(
      predicate.operator,
      predicate.value,
      statistics.minIsExact === false ? undefined : statistics.min,
      statistics.maxIsExact === false ? undefined : statistics.max
    );
  }
  return true;
}

/** Returns exact source row indexes matching a predicate. */
export function filterParquetRowIndices(
  predicate: ParquetPredicate | undefined,
  columns: Record<string, ArrayType>,
  rowCount: number
): number[] {
  if (!predicate) {
    return Array.from({length: rowCount}, (_, index) => index);
  }
  const rowIndices: number[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    if (evaluateParquetPredicate(predicate, columns, rowIndex)) {
      rowIndices.push(rowIndex);
    }
  }
  return rowIndices;
}

/** Gathers selected source rows without constructing row objects. */
export function gatherParquetColumns(
  columns: Record<string, ArrayType>,
  rowIndices: readonly number[],
  selectedColumns?: ReadonlySet<string>
): Record<string, ArrayType> {
  const gatheredColumns: Record<string, ArrayType> = {};
  for (const [name, column] of Object.entries(columns)) {
    if (selectedColumns && !selectedColumns.has(name)) {
      continue;
    }
    gatheredColumns[name] = rowIndices.map(rowIndex => getColumnValue(column, rowIndex));
  }
  return gatheredColumns;
}

/** Applies an exact predicate to one materialized row. */
function evaluateParquetPredicate(
  predicate: ParquetPredicate,
  columns: Record<string, ArrayType>,
  rowIndex: number
): boolean {
  if ('predicates' in predicate) {
    return predicate.operator === 'and'
      ? predicate.predicates.every(child => evaluateParquetPredicate(child, columns, rowIndex))
      : predicate.predicates.some(child => evaluateParquetPredicate(child, columns, rowIndex));
  }
  const value = getColumnValue(columns[predicate.column], rowIndex);
  if (predicate.operator === 'is-null') {
    return value === null || value === undefined;
  }
  if (predicate.operator === 'is-not-null') {
    return value !== null && value !== undefined;
  }
  if (value === null || value === undefined) {
    return false;
  }
  if (predicate.operator === 'in') {
    return predicate.values.some(candidate => comparePredicateValues(value, candidate) === 0);
  }
  if (!('value' in predicate)) {
    return false;
  }
  const comparison = comparePredicateValues(value, predicate.value);
  switch (predicate.operator) {
    case '=':
      return comparison === 0;
    case '!=':
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

/** Returns whether footer min/max leave any possible match for one comparison. */
function canComparisonMatch(
  operator: '=' | '!=' | '<' | '<=' | '>' | '>=',
  value: ParquetPredicateValue,
  minimum: unknown,
  maximum: unknown
): boolean {
  try {
    switch (operator) {
      case '=':
        return !(
          (minimum !== undefined && comparePredicateValues(value, minimum) < 0) ||
          (maximum !== undefined && comparePredicateValues(value, maximum) > 0)
        );
      case '!=':
        return !(
          minimum !== undefined &&
          maximum !== undefined &&
          comparePredicateValues(value, minimum) === 0 &&
          comparePredicateValues(value, maximum) === 0
        );
      case '<':
        return minimum === undefined || comparePredicateValues(minimum, value) < 0;
      case '<=':
        return minimum === undefined || comparePredicateValues(minimum, value) <= 0;
      case '>':
        return maximum === undefined || comparePredicateValues(maximum, value) > 0;
      case '>=':
        return maximum === undefined || comparePredicateValues(maximum, value) >= 0;
    }
  } catch {
    return true;
  }
}

/** Compares predicate-compatible scalar values, including binary values lexicographically. */
function comparePredicateValues(left: unknown, right: unknown): number {
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    const length = Math.min(left.length, right.length);
    for (let index = 0; index < length; index++) {
      if (left[index] !== right[index]) {
        return left[index] < right[index] ? -1 : 1;
      }
    }
    return Math.sign(left.length - right.length);
  }
  const comparableLeft = left instanceof Date ? left.getTime() : left;
  const comparableRight = right instanceof Date ? right.getTime() : right;
  if (
    (typeof comparableLeft === 'number' && Number.isNaN(comparableLeft)) ||
    (typeof comparableRight === 'number' && Number.isNaN(comparableRight))
  ) {
    throw new Error('NaN cannot be ordered by a Parquet predicate');
  }
  if ((comparableLeft as never) < (comparableRight as never)) {
    return -1;
  }
  if ((comparableLeft as never) > (comparableRight as never)) {
    return 1;
  }
  return 0;
}

/** Reads one value from an array-like materialized Parquet column. */
function getColumnValue(column: ArrayType | undefined, rowIndex: number): unknown {
  if (!column) {
    throw new Error('Parquet predicate column was not decoded');
  }
  return (column as ArrayLike<unknown>)[rowIndex];
}

/** Copies mutable binary and date predicate values. */
function copyPredicateValue(value: ParquetPredicateValue): ParquetPredicateValue {
  if (value instanceof Uint8Array) {
    return value.slice();
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  return value;
}

/** Visits every predicate node depth-first. */
function visitParquetPredicate(
  predicate: ParquetPredicate,
  visit: (predicate: ParquetPredicate) => void
): void {
  visit(predicate);
  if ('predicates' in predicate) {
    for (const child of predicate.predicates) {
      visitParquetPredicate(child, visit);
    }
  }
}
