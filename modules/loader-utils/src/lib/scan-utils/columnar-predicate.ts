// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayType} from '@loaders.gl/schema';

/** Scalar values supported by format-neutral columnar predicates. */
export type ColumnarPredicateValue = boolean | number | bigint | string | Date | Uint8Array;

/** Reference to a top-level or nested column. */
export type ColumnarPredicateProperty = {
  property: string | readonly string[];
};

export type ColumnarComparisonPredicate = {
  op: '=' | '<>' | '<' | '<=' | '>' | '>=';
  args: readonly [ColumnarPredicateProperty, ColumnarPredicateValue];
};

export type ColumnarInPredicate = {
  op: 'in';
  args: readonly [ColumnarPredicateProperty, readonly ColumnarPredicateValue[]];
};

export type ColumnarNullPredicate = {
  op: 'isNull';
  args: readonly [ColumnarPredicateProperty];
};

export type ColumnarLogicalPredicate = {
  op: 'and' | 'or';
  args: readonly ColumnarPredicate[];
};

export type ColumnarNotPredicate = {
  op: 'not';
  args: readonly [ColumnarPredicate];
};

/** Small serializable expression tree suitable for scan planning and exact filtering. */
export type ColumnarPredicate =
  | ColumnarComparisonPredicate
  | ColumnarInPredicate
  | ColumnarNullPredicate
  | ColumnarLogicalPredicate
  | ColumnarNotPredicate;

export function getColumnarPredicateColumns(predicate: ColumnarPredicate): string[] {
  return [...new Set(getColumnarPredicatePaths(predicate).map(path => path[0]))];
}

export function getColumnarPredicatePath(property: ColumnarPredicateProperty): string[] {
  return typeof property.property === 'string' ? [property.property] : [...property.property];
}

export function getColumnarPredicatePaths(predicate: ColumnarPredicate): string[][] {
  const paths = new Map<string, string[]>();
  visitColumnarPredicate(predicate, child => {
    if ('property' in child.args[0]) {
      const path = getColumnarPredicatePath(child.args[0]);
      paths.set(path.join('\0'), path);
    }
  });
  return [...paths.values()];
}

export function copyColumnarPredicate(predicate: ColumnarPredicate): ColumnarPredicate {
  if (predicate.op === 'and' || predicate.op === 'or') {
    return {op: predicate.op, args: predicate.args.map(copyColumnarPredicate)};
  }
  if (predicate.op === 'not') {
    return {op: 'not', args: [copyColumnarPredicate(predicate.args[0])]};
  }
  const leaf = predicate as
    | ColumnarComparisonPredicate
    | ColumnarInPredicate
    | ColumnarNullPredicate;
  const property = {property: [...getColumnarPredicatePath(leaf.args[0])]};
  if (leaf.op === 'isNull') return {op: 'isNull', args: [property]};
  if (leaf.op === 'in') {
    return {op: 'in', args: [property, leaf.args[1].map(copyColumnarPredicateValue)]};
  }
  return {op: leaf.op, args: [property, copyColumnarPredicateValue(leaf.args[1])]};
}

export function validateColumnarPredicate(
  predicate: ColumnarPredicate,
  availableColumns: ReadonlySet<string>
): void {
  visitColumnarPredicate(predicate, child => {
    if (child.op === 'and' || child.op === 'or') {
      if (child.args.length < 2)
        throw new Error(`Columnar predicate ${child.op} requires at least two child predicates`);
      return;
    }
    if (child.op === 'not') return;
    const leaf = child as ColumnarComparisonPredicate | ColumnarInPredicate | ColumnarNullPredicate;
    const path = getColumnarPredicatePath(leaf.args[0]);
    if (!path.length || path.some(component => !component)) {
      throw new Error('Columnar predicate property path must contain non-empty strings');
    }
    if (!availableColumns.has(path[0]))
      throw new Error(`Columnar predicate column not found: ${path.join('.')}`);
    if (leaf.op === 'in' && leaf.args[1].length === 0) {
      throw new Error('Columnar predicate in requires at least one value');
    }
  });
}

export function filterColumnarRowIndices(
  predicate: ColumnarPredicate | undefined,
  columns: Record<string, ArrayType>,
  rowCount: number
): number[] {
  if (!predicate) return Array.from({length: rowCount}, (_, index) => index);
  const result: number[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    if (evaluateColumnarPredicate(predicate, columns, rowIndex) === true) result.push(rowIndex);
  }
  return result;
}

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

function evaluateColumnarPredicate(
  predicate: ColumnarPredicate,
  columns: Record<string, ArrayType>,
  rowIndex: number
): boolean | null {
  if (predicate.op === 'and' || predicate.op === 'or') {
    const results = predicate.args.map(child =>
      evaluateColumnarPredicate(child, columns, rowIndex)
    );
    return predicate.op === 'and'
      ? results.includes(false)
        ? false
        : results.includes(null)
          ? null
          : true
      : results.includes(true)
        ? true
        : results.includes(null)
          ? null
          : false;
  }
  if (predicate.op === 'not') {
    const value = evaluateColumnarPredicate(predicate.args[0], columns, rowIndex);
    return value === null ? null : !value;
  }
  const leaf = predicate as
    | ColumnarComparisonPredicate
    | ColumnarInPredicate
    | ColumnarNullPredicate;
  const value = getColumnarValue(columns, getColumnarPredicatePath(leaf.args[0]), rowIndex);
  if (leaf.op === 'isNull') return value === null || value === undefined;
  if (value === null || value === undefined) return null;
  if (leaf.op === 'in')
    return leaf.args[1].some(candidate => compareColumnarValues(value, candidate) === 0);
  const comparison = compareColumnarValues(value, leaf.args[1]);
  return leaf.op === '='
    ? comparison === 0
    : leaf.op === '<>'
      ? comparison !== 0
      : leaf.op === '<'
        ? comparison < 0
        : leaf.op === '<='
          ? comparison <= 0
          : leaf.op === '>'
            ? comparison > 0
            : comparison >= 0;
}

function visitColumnarPredicate(
  predicate: ColumnarPredicate,
  visitor: (predicate: ColumnarPredicate) => void
): void {
  visitor(predicate);
  if (predicate.op === 'and' || predicate.op === 'or')
    predicate.args.forEach(child => visitColumnarPredicate(child, visitor));
  else if (predicate.op === 'not') visitColumnarPredicate(predicate.args[0], visitor);
}

function getColumnarValue(
  columns: Record<string, ArrayType>,
  path: string[],
  rowIndex: number
): unknown {
  let value: any = columns[path[0]]?.[rowIndex];
  for (let index = 1; index < path.length && value != null; index++) value = value[path[index]];
  return value;
}

function copyColumnarPredicateValue(value: ColumnarPredicateValue): ColumnarPredicateValue {
  if (value instanceof Uint8Array) return value.slice();
  if (value instanceof Date) return new Date(value.getTime());
  return value;
}

function compareColumnarValues(left: unknown, right: ColumnarPredicateValue): number {
  if (left instanceof Uint8Array && right instanceof Uint8Array) return compareBytes(left, right);
  if (left instanceof Uint8Array || right instanceof Uint8Array)
    throw new Error('Columnar binary predicates require binary values on both sides');
  if (left instanceof Date || right instanceof Date) {
    if (!(left instanceof Date) || !(right instanceof Date))
      throw new Error('Columnar date predicates require date values on both sides');
    return compareNumbers(left.getTime(), right.getTime());
  }
  const leftType = typeof left;
  const rightType = typeof right;
  const numeric =
    (leftType === 'number' || leftType === 'bigint') &&
    (rightType === 'number' || rightType === 'bigint');
  if (!numeric && leftType !== rightType)
    throw new Error(`Columnar predicate cannot compare ${leftType} with ${rightType}`);
  if (!numeric && leftType !== 'string' && leftType !== 'boolean')
    throw new Error(`Columnar predicate does not support ${leftType} values`);
  return (left as any) < (right as any) ? -1 : (left as any) > (right as any) ? 1 : 0;
}

function compareNumbers(left: number, right: number): number {
  if (!Number.isFinite(left) || !Number.isFinite(right))
    throw new Error('Non-finite values cannot be ordered by a columnar predicate');
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareBytes(left: Uint8Array, right: Uint8Array): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index++)
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  return left.length - right.length;
}
