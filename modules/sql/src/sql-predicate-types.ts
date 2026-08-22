// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Scalar values supported by portable SQL predicate expressions. */
export type SQLPredicateScalar = boolean | number | bigint | string | Date | Uint8Array;

/** Named parameter reference retained in a portable SQL predicate until execution time. */
export type SQLPredicateParameter = Readonly<{
  /** Parameter name without the leading SQL colon. */
  parameter: string;
}>;

/** Scalar value or unresolved named parameter accepted by a portable predicate expression. */
export type SQLPredicateValue = SQLPredicateScalar | SQLPredicateParameter;

/** Runtime values used to bind named predicate parameters before a backend executes them. */
export type SQLPredicateParameterValues = Readonly<Record<string, SQLPredicateScalar>>;

/** Reference to one column in a portable SQL predicate expression. */
export type SQLPredicateProperty = Readonly<{
  /** Column or qualified column name. */
  property: string;
}>;

/** Binary comparison between a column and a scalar value. */
export type SQLComparisonPredicate = Readonly<{
  /** CQL2-shaped comparison operator. */
  op: '=' | '<>' | '<' | '<=' | '>' | '>=';
  /** Column reference followed by the scalar value to compare. */
  args: readonly [SQLPredicateProperty, SQLPredicateValue];
}>;

/** Membership test between a column and scalar values. */
export type SQLInPredicate = Readonly<{
  /** CQL2-shaped membership operator. */
  op: 'in';
  /** Column reference followed by a non-empty list of candidate values. */
  args: readonly [SQLPredicateProperty, readonly SQLPredicateValue[]];
}>;

/** Null test for one column. */
export type SQLNullPredicate = Readonly<{
  /** CQL2-shaped null-test operator. */
  op: 'isNull';
  /** Column reference to test. */
  args: readonly [SQLPredicateProperty];
}>;

/** Conjunction or disjunction of two or more predicates. */
export type SQLLogicalPredicate = Readonly<{
  /** CQL2-shaped logical operator. */
  op: 'and' | 'or';
  /** Two or more child predicates. */
  args: readonly SQLPredicate[];
}>;

/** Negation of one predicate. */
export type SQLNotPredicate = Readonly<{
  /** CQL2-shaped negation operator. */
  op: 'not';
  /** Single child predicate. */
  args: readonly [SQLPredicate];
}>;

/**
 * Portable predicate AST emitted by the loaders.gl SQL expression parser.
 *
 * The expression shape is directionally aligned with CQL2 JSON, but this deliberately small
 * subset does not claim CQL2 conformance.
 */
export type SQLPredicate =
  | SQLComparisonPredicate
  | SQLInPredicate
  | SQLNullPredicate
  | SQLLogicalPredicate
  | SQLNotPredicate;

/** Options for parsing one SQL predicate expression. */
export type SQLPredicateParserOptions = Readonly<{
  /** Named values referenced using SQL parameters such as `:minimumFare`. */
  parameters?: SQLPredicateParameterValues;
  /** Retains named references in the emitted AST instead of resolving them while parsing. */
  preserveParameters?: boolean;
}>;

/** Returns whether a value is a named parameter reference. */
export function isSQLPredicateParameter(value: unknown): value is SQLPredicateParameter {
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
