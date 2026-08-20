// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayType} from '@loaders.gl/schema';

import type {
  ParquetLogicalPredicate,
  ParquetNotPredicate,
  ParquetPredicate,
  ParquetPredicateValue,
  ParquetRowGroupMetadata
} from '../parquet-source-types';

/** Returns the unique top-level columns referenced by a predicate. */
export function getParquetPredicateColumns(predicate: ParquetPredicate): string[] {
  const columns = new Set<string>();
  visitParquetPredicate(predicate, child => {
    const property = getPredicateProperty(child);
    if (property) {
      columns.add(property.property);
    }
  });
  return [...columns];
}

/** Copies a predicate tree and mutable scalar values for read-scoped option snapshots. */
export function copyParquetPredicate(predicate: ParquetPredicate): ParquetPredicate {
  if (isParquetLogicalPredicate(predicate)) {
    return {
      op: predicate.op,
      args: predicate.args.map(copyParquetPredicate)
    };
  }
  if (isParquetNotPredicate(predicate)) {
    return {
      op: 'not',
      args: [copyParquetPredicate(predicate.args[0])]
    };
  }
  const property = copyPredicateProperty(predicate.args[0]);
  if (predicate.op === 'isNull') {
    return {op: 'isNull', args: [property]};
  }
  if (predicate.op === 'in') {
    return {
      op: 'in',
      args: [property, predicate.args[1].map(copyPredicateValue)]
    };
  }
  return {
    op: predicate.op,
    args: [property, copyPredicateValue(predicate.args[1])]
  };
}

/** Validates a predicate and every referenced top-level column. */
export function validateParquetPredicate(
  predicate: ParquetPredicate,
  availableColumns: ReadonlySet<string>
): void {
  visitParquetPredicate(predicate, child => {
    if (isParquetLogicalPredicate(child)) {
      if (child.args.length < 2) {
        throw new Error(`Parquet predicate ${child.op} requires at least two child predicates`);
      }
      return;
    }
    if (isParquetNotPredicate(child)) {
      return;
    }
    const property = child.args[0];
    if (!availableColumns.has(property.property)) {
      throw new Error(`Parquet predicate column not found: ${property.property}`);
    }
    if (child.op === 'in' && child.args[1].length === 0) {
      throw new Error('Parquet predicate in requires at least one value');
    }
  });
}

/** Conservatively determines whether a row group can contain a matching row. */
export function canParquetRowGroupMatch(
  predicate: ParquetPredicate,
  rowGroup: ParquetRowGroupMetadata
): boolean {
  if (isParquetLogicalPredicate(predicate)) {
    return predicate.op === 'and'
      ? predicate.args.every(child => canParquetRowGroupMatch(child, rowGroup))
      : predicate.args.some(child => canParquetRowGroupMatch(child, rowGroup));
  }
  if (isParquetNotPredicate(predicate)) {
    const child = predicate.args[0];
    if (child.op !== 'isNull') {
      return true;
    }
    const column = getRowGroupColumn(rowGroup, child.args[0].property);
    return !column?.statistics || column.statistics.nullCount !== rowGroup.rowCount;
  }

  const column = getRowGroupColumn(rowGroup, predicate.args[0].property);
  const statistics = column?.statistics;
  if (!statistics) {
    return true;
  }
  if (statistics.nullCount === rowGroup.rowCount) {
    return predicate.op === 'isNull';
  }
  if (predicate.op === 'isNull') {
    return statistics.nullCount !== 0;
  }
  if (predicate.op === 'in') {
    return predicate.args[1].some(value =>
      canComparisonMatch(
        '=',
        value,
        statistics.minIsExact === false ? undefined : statistics.min,
        statistics.maxIsExact === false ? undefined : statistics.max
      )
    );
  }
  return canComparisonMatch(
    predicate.op,
    predicate.args[1],
    statistics.minIsExact === false ? undefined : statistics.min,
    statistics.maxIsExact === false ? undefined : statistics.max
  );
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
    if (evaluateParquetPredicate(predicate, columns, rowIndex) === true) {
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
): boolean | null {
  if (isParquetLogicalPredicate(predicate)) {
    const results = predicate.args.map(child => evaluateParquetPredicate(child, columns, rowIndex));
    if (predicate.op === 'and') {
      return results.includes(false) ? false : results.includes(null) ? null : true;
    }
    return results.includes(true) ? true : results.includes(null) ? null : false;
  }
  if (isParquetNotPredicate(predicate)) {
    const result = evaluateParquetPredicate(predicate.args[0], columns, rowIndex);
    return result === null ? null : !result;
  }
  const value = getColumnValue(columns[predicate.args[0].property], rowIndex);
  if (predicate.op === 'isNull') {
    return value === null || value === undefined;
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (predicate.op === 'in') {
    return predicate.args[1].some(candidate => comparePredicateValues(value, candidate) === 0);
  }
  const comparison = comparePredicateValues(value, predicate.args[1]);
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

/** Returns whether footer min/max leave any possible match for one comparison. */
function canComparisonMatch(
  operator: '=' | '<>' | '<' | '<=' | '>' | '>=',
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
      case '<>':
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

/** Copies a predicate property reference. */
function copyPredicateProperty(property: {property: string}): {property: string} {
  return {property: property.property};
}

/** Returns the property reference from a leaf predicate. */
function getPredicateProperty(predicate: ParquetPredicate): {property: string} | undefined {
  return isParquetLogicalPredicate(predicate) || isParquetNotPredicate(predicate)
    ? undefined
    : predicate.args[0];
}

/** Returns one top-level column chunk from normalized row-group metadata. */
function getRowGroupColumn(rowGroup: ParquetRowGroupMetadata, property: string) {
  return rowGroup.columns.find(
    columnChunk => columnChunk.path.length === 1 && columnChunk.path[0] === property
  );
}

/** Visits every predicate node depth-first. */
function visitParquetPredicate(
  predicate: ParquetPredicate,
  visit: (predicate: ParquetPredicate) => void
): void {
  visit(predicate);
  if (isParquetLogicalPredicate(predicate) || isParquetNotPredicate(predicate)) {
    for (const child of predicate.args) {
      visitParquetPredicate(child, visit);
    }
  }
}

/** Returns whether a predicate combines multiple child predicates. */
function isParquetLogicalPredicate(
  predicate: ParquetPredicate
): predicate is ParquetLogicalPredicate {
  return predicate.op === 'and' || predicate.op === 'or';
}

/** Returns whether a predicate negates one child predicate. */
function isParquetNotPredicate(predicate: ParquetPredicate): predicate is ParquetNotPredicate {
  return predicate.op === 'not';
}
