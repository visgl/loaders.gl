// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getColumnarPredicateColumns,
  validateColumnarPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateProperty
} from './columnar-predicate';

/** Immutable, backend-neutral request for a scan, filter, projection, and limit. */
export type TableQueryOptions<
  PredicateT extends ColumnarPredicate<unknown, ColumnarPredicateProperty> = ColumnarPredicate
> = Readonly<{
  /** Portable predicate applied before projection. */
  predicate?: PredicateT;
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

/** Applies a portable predicate while all predicate columns remain available. */
export type TableQueryFilterStep<PredicateT = ColumnarPredicate> = Readonly<{
  /** Plan discriminator. */
  kind: 'filter';
  /** Predicate evaluated using three-valued Boolean semantics. */
  predicate: PredicateT;
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
export type TableQueryPlanStep<PredicateT = ColumnarPredicate> =
  | TableQueryScanStep
  | TableQueryFilterStep<PredicateT>
  | TableQueryProjectStep
  | TableQueryLimitStep;

/** Immutable logical query plan shared by CPU, SQL, and GPU backends. */
export type TableQueryPlan<PredicateT = ColumnarPredicate> =
  readonly TableQueryPlanStep<PredicateT>[];

/** Capability levels for an individual portable table-query operator. */
export type TableQueryOperatorSupport =
  | 'unsupported'
  | 'residual'
  | 'pushdown'
  | 'pushdown+residual';

/** Optimization and correctness capabilities advertised by a table-query backend. */
export type TableQueryCapabilities = Readonly<{
  /** Whether output projection can avoid reading unrequested columns. */
  projection: TableQueryOperatorSupport;
  /** Whether predicates are unsupported, residual, pushed down, or both pushed and residual. */
  predicate: TableQueryOperatorSupport;
  /** Whether limits are unsupported, applied after execution, or stop physical work early. */
  limit: TableQueryOperatorSupport;
  /** Whether the backend can stream bounded result batches. */
  streaming: boolean;
  /** Whether active and queued physical work observes cancellation. */
  cancellation: boolean;
}>;

/**
 * Produces the canonical scan, filter, project, and limit sequence for a table query.
 *
 * Predicate columns are retained by the scan even if callers omit them from the output projection.
 * This makes SQL `WHERE` semantics independent of a backend's internal API call order.
 */
export function planTableQuery<
  ValueT,
  PropertyT extends ColumnarPredicateProperty,
  PredicateT extends ColumnarPredicate<ValueT, PropertyT>
>(
  sourceColumnNames: readonly string[],
  options: TableQueryOptions<PredicateT> = {}
): TableQueryPlan<PredicateT> {
  validateTableQueryOptions(sourceColumnNames, options);

  const outputColumnNames = options.columns ? [...options.columns] : [...sourceColumnNames];
  const predicateColumnNames = options.predicate
    ? getColumnarPredicateColumns(options.predicate)
    : [];
  const requiredColumnNames = new Set([...outputColumnNames, ...predicateColumnNames]);
  const scanColumnNames = sourceColumnNames.filter(columnName =>
    requiredColumnNames.has(columnName)
  );
  const steps: TableQueryPlanStep<PredicateT>[] = [
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

/** Validates a portable table query against the columns exposed by one source. */
export function validateTableQueryOptions<
  ValueT,
  PropertyT extends ColumnarPredicateProperty,
  PredicateT extends ColumnarPredicate<ValueT, PropertyT>
>(sourceColumnNames: readonly string[], options: TableQueryOptions<PredicateT>): void {
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
  validateTableQueryLimit(options.limit);
  if (options.predicate) {
    validateColumnarPredicate(options.predicate, availableColumnNames);
  }
}

/** Validates a portable table-query limit independently of source-schema validation. */
export function validateTableQueryLimit(limit: number | undefined): void {
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
    throw new Error('Table query limit must be a non-negative safe integer.');
  }
}
