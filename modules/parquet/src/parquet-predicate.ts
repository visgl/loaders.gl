// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayType} from '@loaders.gl/schema';
import {
  copyColumnarPredicate,
  filterColumnarRowIndices,
  gatherColumnarColumns,
  getColumnarPredicateColumns,
  validateColumnarPredicate
} from '@loaders.gl/loader-utils';

import type {
  ParquetColumnChunkStatistics,
  ParquetComparisonPredicate,
  ParquetInPredicate,
  ParquetLogicalPredicate,
  ParquetNotPredicate,
  ParquetNullPredicate,
  ParquetPredicate,
  ParquetPredicateValue,
  ParquetRowGroupMetadata
} from './parquet-source-types';
import {encodeUtf8} from './parquetjs/utils/binary-utils';

/** Returns the unique top-level columns referenced by a predicate. */
export function getParquetPredicateColumns(predicate: ParquetPredicate): string[] {
  return getColumnarPredicateColumns(predicate);
}

/** Copies a predicate tree and mutable scalar values for read-scoped option snapshots. */
export function copyParquetPredicate(predicate: ParquetPredicate): ParquetPredicate {
  return copyColumnarPredicate(predicate) as ParquetPredicate;
}

/** Validates a predicate and every referenced top-level column. */
export function validateParquetPredicate(
  predicate: ParquetPredicate,
  availableColumns: ReadonlySet<string>
): void {
  try {
    validateColumnarPredicate(predicate, availableColumns);
  } catch (error) {
    if (error instanceof Error) {
      error.message = error.message.replaceAll('Columnar predicate', 'Parquet predicate');
    }
    throw error;
  }
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
    const column = getRowGroupColumn(rowGroup, getPredicatePath(child.args[0].property));
    return !column?.statistics || column.statistics.nullCount !== rowGroup.rowCount;
  }

  const column = getRowGroupColumn(rowGroup, getPredicatePath(predicate.args[0].property));
  const statistics = column?.statistics;
  if (!statistics) {
    return true;
  }
  return canParquetStatisticsMatch(predicate, statistics, rowGroup.rowCount);
}

/** Conservatively determines whether one predicate leaf can match supplied statistics. */
export function canParquetStatisticsMatch(
  predicate: ParquetComparisonPredicate | ParquetInPredicate | ParquetNullPredicate,
  statistics: ParquetColumnChunkStatistics,
  rowCount: number
): boolean {
  if (statistics.nullCount === rowCount) {
    return predicate.op === 'isNull';
  }
  if (predicate.op === 'isNull') {
    return statistics.nullCount !== 0;
  }
  const minimum = statistics.minIsExact === false ? undefined : statistics.min;
  const maximum = statistics.maxIsExact === false ? undefined : statistics.max;
  if (predicate.op === 'in') {
    return predicate.args[1].some(value => canComparisonMatch('=', value, minimum, maximum));
  }
  return canComparisonMatch(predicate.op, predicate.args[1], minimum, maximum);
}

/** Returns exact source row indexes matching a predicate. */
export function filterParquetRowIndices(
  predicate: ParquetPredicate | undefined,
  columns: Record<string, ArrayType>,
  rowCount: number
): number[] {
  return filterColumnarRowIndices(predicate, columns, rowCount);
}

/** Gathers selected source rows without constructing row objects. */
export function gatherParquetColumns(
  columns: Record<string, ArrayType>,
  rowIndices: readonly number[],
  selectedColumns?: ReadonlySet<string>
): Record<string, ArrayType> {
  return gatherColumnarColumns(columns, rowIndices, selectedColumns);
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
          (minimum !== undefined && compareStatisticsValues(value, minimum) < 0) ||
          (maximum !== undefined && compareStatisticsValues(value, maximum) > 0)
        );
      case '<>':
        return !(
          minimum !== undefined &&
          maximum !== undefined &&
          compareStatisticsValues(value, minimum) === 0 &&
          compareStatisticsValues(value, maximum) === 0
        );
      case '<':
        return minimum === undefined || compareStatisticsValues(minimum, value) < 0;
      case '<=':
        return minimum === undefined || compareStatisticsValues(minimum, value) <= 0;
      case '>':
        return maximum === undefined || compareStatisticsValues(maximum, value) > 0;
      case '>=':
        return maximum === undefined || compareStatisticsValues(maximum, value) >= 0;
    }
  } catch {
    return true;
  }
}

/** Compares statistics using Parquet's unsigned UTF-8 byte ordering for strings. */
function compareStatisticsValues(left: unknown, right: unknown): number {
  if (typeof left === 'string' && typeof right === 'string') {
    return compareUint8Arrays(encodeUtf8(left), encodeUtf8(right));
  }
  return comparePredicateValues(left, right);
}

/** Compares predicate-compatible scalar values and rejects incomparable types. */
function comparePredicateValues(left: unknown, right: unknown): number {
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return compareUint8Arrays(left, right);
  }
  if (left instanceof Uint8Array || right instanceof Uint8Array) {
    throw new Error('Parquet binary predicates require binary values on both sides');
  }
  if (left instanceof Date || right instanceof Date) {
    if (!(left instanceof Date) || !(right instanceof Date)) {
      throw new Error('Parquet date predicates require date values on both sides');
    }
    const leftTime = left.getTime();
    const rightTime = right.getTime();
    if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) {
      throw new Error('Invalid dates cannot be ordered by a Parquet predicate');
    }
    return leftTime < rightTime ? -1 : leftTime > rightTime ? 1 : 0;
  }
  const leftType = typeof left;
  const rightType = typeof right;
  const bothNumeric =
    (leftType === 'number' || leftType === 'bigint') &&
    (rightType === 'number' || rightType === 'bigint');
  if (!bothNumeric && leftType !== rightType) {
    throw new Error(`Parquet predicate cannot compare ${leftType} with ${rightType}`);
  }
  if (!bothNumeric && leftType !== 'string' && leftType !== 'boolean') {
    throw new Error(`Parquet predicate does not support ${leftType} values`);
  }
  const comparableLeft = left as string | boolean | number | bigint;
  const comparableRight = right as string | boolean | number | bigint;
  if (
    (typeof comparableLeft === 'number' && !Number.isFinite(comparableLeft)) ||
    (typeof comparableRight === 'number' && !Number.isFinite(comparableRight))
  ) {
    throw new Error('Non-finite numbers cannot be ordered by a Parquet predicate');
  }
  if ((comparableLeft as never) < (comparableRight as never)) {
    return -1;
  }
  if ((comparableLeft as never) > (comparableRight as never)) {
    return 1;
  }
  return 0;
}

/** Compares two byte sequences using unsigned lexicographic ordering. */
function compareUint8Arrays(left: Uint8Array, right: Uint8Array): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index++) {
    if (left[index] !== right[index]) {
      return left[index] < right[index] ? -1 : 1;
    }
  }
  return Math.sign(left.length - right.length);
}

/** Returns one top-level column chunk from normalized row-group metadata. */
function getPredicatePath(property: string | readonly string[]): readonly string[] {
  return typeof property === 'string' ? [property] : property;
}

/** Returns one top-level or nested column chunk from normalized row-group metadata. */
function getRowGroupColumn(rowGroup: ParquetRowGroupMetadata, path: readonly string[]) {
  return rowGroup.columns.find(
    columnChunk =>
      columnChunk.path.length === path.length &&
      columnChunk.path.every((part, index) => part === path[index])
  );
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
