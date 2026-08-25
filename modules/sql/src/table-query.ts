// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getColumnarPredicateColumns,
  planTableQuery as planColumnarTableQuery,
  type TableQueryFilterStep as ColumnarTableQueryFilterStep,
  type TableQueryLimitStep as ColumnarTableQueryLimitStep,
  type TableQueryOptions as ColumnarTableQueryOptions,
  type TableQueryPlan as ColumnarTableQueryPlan,
  type TableQueryPlanStep as ColumnarTableQueryPlanStep,
  type TableQueryProjectStep as ColumnarTableQueryProjectStep,
  type TableQueryScanStep as ColumnarTableQueryScanStep
} from '@loaders.gl/loader-utils';

import {validateSQLPredicate} from './sql-predicate-schema';
import type {SQLPredicate} from './sql-predicate-types';

/** Immutable, backend-neutral request for a table query. */
export type TableQueryOptions = ColumnarTableQueryOptions<SQLPredicate>;

/** Reads the minimum source columns required by the remaining table-query plan. */
export type TableQueryScanStep = ColumnarTableQueryScanStep;

/** Applies a portable SQL predicate while all predicate columns remain available. */
export type TableQueryFilterStep = ColumnarTableQueryFilterStep<SQLPredicate>;

/** Narrows the result to requested output columns. */
export type TableQueryProjectStep = ColumnarTableQueryProjectStep;

/** Retains the first rows in source order after filtering and projection. */
export type TableQueryLimitStep = ColumnarTableQueryLimitStep;

/** One immutable operation in a normalized table-query plan. */
export type TableQueryPlanStep = ColumnarTableQueryPlanStep<SQLPredicate>;

/** Immutable logical query plan shared by Arrow and GPU dataframe backends. */
export type TableQueryPlan = ColumnarTableQueryPlan<SQLPredicate>;

/**
 * Produces the canonical scan, filter, project, and limit sequence for a table query.
 *
 * Predicate columns are retained by the scan even if callers omit them from the output projection.
 * This makes SQL `WHERE` semantics independent of a backend's internal API call order.
 */
export function planTableQuery(
  sourceColumnNames: readonly string[],
  options: TableQueryOptions = {}
): TableQueryPlan {
  if (options.predicate) {
    validateSQLPredicate(options.predicate);
  }
  return planColumnarTableQuery(sourceColumnNames, options);
}

/** Returns every source column referenced by one portable predicate, in first-use order. */
export function getSQLPredicateColumnNames(predicate: SQLPredicate): string[] {
  return getColumnarPredicateColumns(predicate);
}
