// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  compileColumnarPredicate,
  type ColumnarPredicateReader
} from '@math.gl/sql/columnar-predicate';
import type {ArrayType} from '@loaders.gl/core/schema';

/** Scalar values supported by format-neutral columnar predicates. */
export type ColumnarPredicateValue = boolean | number | bigint | string | Date | Uint8Array;

/** Named value retained in a portable predicate until an executor binds it. */
export type ColumnarPredicateParameter = Readonly<{
  /** Parameter name without a query-language prefix. */
  parameter: string;
}>;

/** Concrete scalar or unresolved named value accepted while constructing a predicate. */
export type ColumnarPredicateInputValue = ColumnarPredicateValue | ColumnarPredicateParameter;

/** Runtime values used to bind named predicate parameters. */
export type ColumnarPredicateParameterValues = Readonly<Record<string, ColumnarPredicateValue>>;

/** Reference to a top-level or nested column. */
export type ColumnarPredicateProperty = {
  property: string | readonly string[];
};

export type ColumnarComparisonPredicate<
  ValueT = ColumnarPredicateValue,
  PropertyT extends ColumnarPredicateProperty = ColumnarPredicateProperty
> = {
  op: '=' | '<>' | '<' | '<=' | '>' | '>=';
  args: readonly [PropertyT, ValueT];
};

export type ColumnarInPredicate<
  ValueT = ColumnarPredicateValue,
  PropertyT extends ColumnarPredicateProperty = ColumnarPredicateProperty
> = {
  op: 'in';
  args: readonly [PropertyT, readonly ValueT[]];
};

export type ColumnarNullPredicate<
  PropertyT extends ColumnarPredicateProperty = ColumnarPredicateProperty
> = {
  op: 'isNull';
  args: readonly [PropertyT];
};

export type ColumnarLogicalPredicate<
  ValueT = ColumnarPredicateValue,
  PropertyT extends ColumnarPredicateProperty = ColumnarPredicateProperty
> = {
  op: 'and' | 'or';
  args: readonly ColumnarPredicate<ValueT, PropertyT>[];
};

export type ColumnarNotPredicate<
  ValueT = ColumnarPredicateValue,
  PropertyT extends ColumnarPredicateProperty = ColumnarPredicateProperty
> = {
  op: 'not';
  args: readonly [ColumnarPredicate<ValueT, PropertyT>];
};

/** Small serializable expression tree suitable for scan planning and exact filtering. */
export type ColumnarPredicate<
  ValueT = ColumnarPredicateValue,
  PropertyT extends ColumnarPredicateProperty = ColumnarPredicateProperty
> =
  | ColumnarComparisonPredicate<ValueT, PropertyT>
  | ColumnarInPredicate<ValueT, PropertyT>
  | ColumnarNullPredicate<PropertyT>
  | ColumnarLogicalPredicate<ValueT, PropertyT>
  | ColumnarNotPredicate<ValueT, PropertyT>;

/** Predicate form that may retain named parameters before physical execution. */
export type ParameterizedColumnarPredicate<
  PropertyT extends ColumnarPredicateProperty = ColumnarPredicateProperty
> = ColumnarPredicate<ColumnarPredicateInputValue, PropertyT>;

export function getColumnarPredicateColumns<ValueT, PropertyT extends ColumnarPredicateProperty>(
  predicate: ColumnarPredicate<ValueT, PropertyT>
): string[] {
  return [...new Set(getColumnarPredicatePaths(predicate).map(path => path[0]))];
}

export function getColumnarPredicatePath(property: ColumnarPredicateProperty): string[] {
  return typeof property.property === 'string' ? [property.property] : [...property.property];
}

export function getColumnarPredicatePaths<ValueT, PropertyT extends ColumnarPredicateProperty>(
  predicate: ColumnarPredicate<ValueT, PropertyT>
): string[][] {
  const paths = new Map<string, string[]>();
  visitColumnarPredicate(predicate, child => {
    if ('property' in child.args[0]) {
      const path = getColumnarPredicatePath(child.args[0]);
      paths.set(path.join('\0'), path);
    }
  });
  return [...paths.values()];
}

/** Returns unresolved named parameter names in their first-occurrence order. */
export function getColumnarPredicateParameterNames<PropertyT extends ColumnarPredicateProperty>(
  predicate: ParameterizedColumnarPredicate<PropertyT>
): string[] {
  const parameterNames = new Set<string>();
  visitColumnarPredicate(predicate, child => {
    if (child.op === 'and' || child.op === 'or' || child.op === 'not' || child.op === 'isNull') {
      return;
    }
    const values = child.op === 'in' ? child.args[1] : [child.args[1]];
    for (const value of values) {
      if (isColumnarPredicateParameter(value)) {
        parameterNames.add(value.parameter);
      }
    }
  });
  return [...parameterNames];
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
  predicate: ColumnarPredicate<unknown>,
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

/** Returns whether a predicate value is an unresolved named parameter. */
export function isColumnarPredicateParameter(value: unknown): value is ColumnarPredicateParameter {
  const parameterValue = value as {parameter?: unknown};
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    Object.hasOwn(value, 'parameter') &&
    typeof parameterValue.parameter === 'string' &&
    parameterValue.parameter.length > 0
  );
}

/** Returns whether a runtime value belongs to the portable predicate scalar set. */
export function isColumnarPredicateValue(value: unknown): value is ColumnarPredicateValue {
  return (
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    (value instanceof Date && Number.isFinite(value.getTime())) ||
    value instanceof Uint8Array
  );
}

/** Binds every named parameter without mutating the portable predicate. */
export function bindColumnarPredicateParameters<
  PropertyT extends ColumnarPredicateProperty = ColumnarPredicateProperty
>(
  predicate: ParameterizedColumnarPredicate<PropertyT>,
  parameters: ColumnarPredicateParameterValues
): ColumnarPredicate<ColumnarPredicateValue, PropertyT> {
  switch (predicate.op) {
    case 'and':
    case 'or':
      return {
        op: predicate.op,
        args: predicate.args.map(child => bindColumnarPredicateParameters(child, parameters))
      };
    case 'not':
      return {
        op: 'not',
        args: [bindColumnarPredicateParameters(predicate.args[0], parameters)]
      };
    case 'isNull':
      return {op: 'isNull', args: [copyColumnarPredicateProperty(predicate.args[0])]};
    case 'in':
      return {
        op: 'in',
        args: [
          copyColumnarPredicateProperty(predicate.args[0]),
          predicate.args[1].map(value => bindColumnarPredicateValue(value, parameters))
        ]
      };
    default:
      return {
        op: predicate.op,
        args: [
          copyColumnarPredicateProperty(predicate.args[0]),
          bindColumnarPredicateValue(predicate.args[1], parameters)
        ]
      };
  }
}

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

function visitColumnarPredicate<ValueT, PropertyT extends ColumnarPredicateProperty>(
  predicate: ColumnarPredicate<ValueT, PropertyT>,
  visitor: (predicate: ColumnarPredicate<ValueT, PropertyT>) => void
): void {
  visitor(predicate);
  if (predicate.op === 'and' || predicate.op === 'or')
    predicate.args.forEach(child => visitColumnarPredicate(child, visitor));
  else if (predicate.op === 'not') visitColumnarPredicate(predicate.args[0], visitor);
}

/** Resolves one parameter reference or returns an already concrete scalar. */
function bindColumnarPredicateValue(
  value: ColumnarPredicateInputValue,
  parameters: ColumnarPredicateParameterValues
): ColumnarPredicateValue {
  if (!isColumnarPredicateParameter(value)) return value;
  if (!Object.hasOwn(parameters, value.parameter)) {
    throw new Error(`Columnar predicate parameter ":${value.parameter}" requires a value`);
  }
  const parameterValue = parameters[value.parameter];
  if (isColumnarPredicateParameter(parameterValue)) {
    throw new Error(
      `Columnar predicate parameter ":${value.parameter}" cannot reference another parameter`
    );
  }
  if (!isColumnarPredicateValue(parameterValue)) {
    throw new Error(`Columnar predicate parameter ":${value.parameter}" has an unsupported value`);
  }
  return copyColumnarPredicateValue(parameterValue);
}

/** Copies a property while preserving its backend-specific property subtype. */
function copyColumnarPredicateProperty<PropertyT extends ColumnarPredicateProperty>(
  property: PropertyT
): PropertyT {
  return {
    ...property,
    property: typeof property.property === 'string' ? property.property : [...property.property]
  } as PropertyT;
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

function copyColumnarPredicateValue(value: ColumnarPredicateValue): ColumnarPredicateValue {
  if (value instanceof Uint8Array) return value.slice();
  if (value instanceof Date) return new Date(value.getTime());
  return value;
}
