// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  compileColumnarPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateReader
} from '@math.gl/sql/columnar-predicate';
import type {ArrayType} from '@loaders.gl/core/schema';

export {
  bindColumnarPredicateParameters,
  copyColumnarPredicate,
  getColumnarPredicateColumns,
  getColumnarPredicateParameterNames,
  getColumnarPredicatePath,
  getColumnarPredicatePaths,
  isColumnarPredicateParameter,
  isColumnarPredicateValue,
  validateColumnarPredicate,
  type ColumnarComparisonPredicate,
  type ColumnarInPredicate,
  type ColumnarLogicalPredicate,
  type ColumnarNotPredicate,
  type ColumnarNullPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateInputValue,
  type ColumnarPredicateParameter,
  type ColumnarPredicateParameterValues,
  type ColumnarPredicateProperty,
  type ColumnarPredicateValue,
  type ParameterizedColumnarPredicate
} from '@math.gl/sql/columnar-predicate';

/** Finds the source rows matching a bound portable predicate. */
export function filterColumnarRowIndices(
  predicate: ColumnarPredicate | undefined,
  columns: Record<string, ArrayType>,
  rowCount: number
): number[] {
  if (!predicate) return Array.from({length: rowCount}, (_, index) => index);
  const evaluate = compileColumnarPredicate(predicate, path => bindColumnarReader(columns, path));
  const result: number[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    if (evaluate(rowIndex) === true) result.push(rowIndex);
  }
  return result;
}

/** Gathers selected rows from format-neutral column arrays. */
export function gatherColumnarColumns(
  columns: Record<string, ArrayType>,
  rowIndices: readonly number[],
  selectedColumns?: ReadonlySet<string>
): Record<string, ArrayType> {
  const result: Record<string, ArrayType> = {};
  for (const [name, column] of Object.entries(columns)) {
    if (!selectedColumns || selectedColumns.has(name)) {
      result[name] = rowIndices.map(rowIndex => (column as ArrayLike<unknown>)[rowIndex]);
    }
  }
  return result;
}

/** Binds a portable predicate path to one source column. */
function bindColumnarReader(
  columns: Record<string, ArrayType>,
  [name, ...path]: readonly string[]
): ColumnarPredicateReader {
  const column = columns[name];
  return rowIndex => {
    let value = column?.[rowIndex];
    for (const property of path) {
      if (value == null) return null;
      value = value[property];
    }
    return value as ReturnType<ColumnarPredicateReader>;
  };
}
