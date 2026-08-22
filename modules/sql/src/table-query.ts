// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {validateSQLPredicate} from './sql-predicate-schema';
import type {SQLPredicate} from './sql-predicate-types';

/** Immutable, backend-neutral request for a table query. */
export type TableQueryOptions = Readonly<{
  /** Portable SQL predicate applied before projection. */
  predicate?: SQLPredicate;
  /** Output columns in caller-specified order. Defaults to every source column. */
  columns?: readonly string[];
  /** Maximum number of rows retained after filtering and projection. */
  limit?: number;
}>;

/** Reads the minimum source columns required by the remaining table-query plan. */
export type TableQueryScanStep = Readonly<{
  /** Plan discriminator. */
  kind: 'scan';
  /** Source columns required for filtering and output. */
  columns: readonly string[];
}>;

/** Applies a portable SQL predicate while all predicate columns remain available. */
export type TableQueryFilterStep = Readonly<{
  /** Plan discriminator. */
  kind: 'filter';
  /** Predicate evaluated using SQL three-valued Boolean semantics. */
  predicate: SQLPredicate;
}>;

/** Narrows the result to requested output columns. */
export type TableQueryProjectStep = Readonly<{
  /** Plan discriminator. */
  kind: 'project';
  /** Output columns in caller-specified order. */
  columns: readonly string[];
}>;

/** Retains the first rows in source order after filtering and projection. */
export type TableQueryLimitStep = Readonly<{
  /** Plan discriminator. */
  kind: 'limit';
  /** Maximum number of retained rows. */
  limit: number;
}>;

/** One immutable operation in a normalized table-query plan. */
export type TableQueryPlanStep =
  | TableQueryScanStep
  | TableQueryFilterStep
  | TableQueryProjectStep
  | TableQueryLimitStep;

/** Immutable logical query plan shared by Arrow and GPU dataframe backends. */
export type TableQueryPlan = readonly TableQueryPlanStep[];

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
  validateTableQueryOptions(sourceColumnNames, options);

  const outputColumnNames = options.columns ? [...options.columns] : [...sourceColumnNames];
  const predicateColumnNames = options.predicate
    ? getSQLPredicateColumnNames(options.predicate)
    : [];
  const requiredColumnNames = new Set([...outputColumnNames, ...predicateColumnNames]);
  const scanColumnNames = sourceColumnNames.filter(columnName =>
    requiredColumnNames.has(columnName)
  );
  const steps: TableQueryPlanStep[] = [
    Object.freeze({kind: 'scan' as const, columns: Object.freeze(scanColumnNames)})
  ];

  if (options.predicate) {
    steps.push(Object.freeze({kind: 'filter' as const, predicate: options.predicate}));
  }
  steps.push(Object.freeze({kind: 'project' as const, columns: Object.freeze(outputColumnNames)}));
  if (options.limit !== undefined) {
    steps.push(Object.freeze({kind: 'limit' as const, limit: options.limit}));
  }
  return Object.freeze(steps);
}

/** Returns every source column referenced by one portable predicate, in first-use order. */
export function getSQLPredicateColumnNames(predicate: SQLPredicate): string[] {
  const columnNames = new Set<string>();
  visitSQLPredicate(predicate, currentPredicate => {
    if (
      currentPredicate.op !== 'and' &&
      currentPredicate.op !== 'or' &&
      currentPredicate.op !== 'not'
    ) {
      columnNames.add((currentPredicate.args[0] as {property: string}).property);
    }
  });
  return [...columnNames];
}

/** Validates a table-query request against a source schema before a backend receives it. */
function validateTableQueryOptions(
  sourceColumnNames: readonly string[],
  options: TableQueryOptions
): void {
  const availableColumnNames = new Set(sourceColumnNames);
  const outputColumnNames = options.columns ?? sourceColumnNames;
  const seenColumnNames = new Set<string>();
  for (const columnName of outputColumnNames) {
    if (!availableColumnNames.has(columnName)) {
      throw new Error(`Table query column not found: ${columnName}`);
    }
    if (seenColumnNames.has(columnName)) {
      throw new Error(`Table query column was selected more than once: ${columnName}`);
    }
    seenColumnNames.add(columnName);
  }
  if (options.limit !== undefined && (!Number.isSafeInteger(options.limit) || options.limit < 0)) {
    throw new Error('Table query limit must be a non-negative safe integer.');
  }
  if (options.predicate) {
    validateSQLPredicate(options.predicate);
    for (const columnName of getSQLPredicateColumnNames(options.predicate)) {
      if (!availableColumnNames.has(columnName)) {
        throw new Error(`Table query predicate column not found: ${columnName}`);
      }
    }
  }
}

/** Recursively visits every predicate node in depth-first order. */
function visitSQLPredicate(
  predicate: SQLPredicate,
  visit: (predicate: SQLPredicate) => void
): void {
  visit(predicate);
  if (predicate.op === 'and' || predicate.op === 'or' || predicate.op === 'not') {
    for (const child of predicate.args) {
      visitSQLPredicate(child, visit);
    }
  }
}
