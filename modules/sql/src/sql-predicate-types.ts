// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  isColumnarPredicateParameter,
  type ColumnarComparisonPredicate,
  type ColumnarInPredicate,
  type ColumnarLogicalPredicate,
  type ColumnarNotPredicate,
  type ColumnarNullPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateInputValue,
  type ColumnarPredicateParameter,
  type ColumnarPredicateParameterValues,
  type ColumnarPredicateValue
} from '@loaders.gl/loader-utils';

/** Scalar values supported by portable SQL predicate expressions. */
export type SQLPredicateScalar = ColumnarPredicateValue;

/** Named parameter reference retained in a portable SQL predicate until execution time. */
export type SQLPredicateParameter = ColumnarPredicateParameter;

/** Scalar value or unresolved named parameter accepted by a portable predicate expression. */
export type SQLPredicateValue = ColumnarPredicateInputValue;

/** Runtime values used to bind named predicate parameters before a backend executes them. */
export type SQLPredicateParameterValues = ColumnarPredicateParameterValues;

/** Reference to one column in a portable SQL predicate expression. */
export type SQLPredicateProperty = Readonly<{
  /** Column or qualified column name. */
  property: string;
  /** Whether the complete property was a quoted SQL identifier. */
  quoted?: boolean;
}>;

/** Binary comparison between a column and a scalar value. */
export type SQLComparisonPredicate = Readonly<
  ColumnarComparisonPredicate<SQLPredicateValue, SQLPredicateProperty>
>;

/** Membership test between a column and scalar values. */
export type SQLInPredicate = Readonly<ColumnarInPredicate<SQLPredicateValue, SQLPredicateProperty>>;

/** Null test for one column. */
export type SQLNullPredicate = Readonly<ColumnarNullPredicate<SQLPredicateProperty>>;

/** Conjunction or disjunction of two or more predicates. */
export type SQLLogicalPredicate = Readonly<
  ColumnarLogicalPredicate<SQLPredicateValue, SQLPredicateProperty>
>;

/** Negation of one predicate. */
export type SQLNotPredicate = Readonly<
  ColumnarNotPredicate<SQLPredicateValue, SQLPredicateProperty>
>;

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

/** Portable SQL predicate whose named parameters have all been replaced by concrete scalars. */
export type BoundSQLPredicate = ColumnarPredicate<SQLPredicateScalar, SQLPredicateProperty>;

/** Options for parsing one SQL predicate expression. */
export type SQLPredicateParserOptions = Readonly<{
  /** Named values referenced using SQL parameters such as `:minimumFare`. */
  parameters?: SQLPredicateParameterValues;
  /** Retains named references in the emitted AST instead of resolving them while parsing. */
  preserveParameters?: boolean;
}>;

/** Returns whether a value is a named parameter reference. */
export function isSQLPredicateParameter(value: unknown): value is SQLPredicateParameter {
  return isColumnarPredicateParameter(value);
}
