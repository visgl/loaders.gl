// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  validateColumnarPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateProperty
} from './columnar-predicate';
import {
  planTableQuery,
  validateTableQueryLimit,
  validateTableQueryOffset,
  type TableQuery,
  type TableReference,
  type TableQueryPlanStep
} from './table-query';

/** Explicit source-to-output mapping for one selected field. */
export type NormalizedTableSelection = Readonly<{
  /** Column read from the source. */
  column: string;
  /** Name of the returned field. */
  as: string;
}>;

/** Logical query with all output selections expanded into explicit mappings. */
export type NormalizedTableQuery<PredicateT = ColumnarPredicate> = Readonly<{
  /** Optional source reference preserved separately from physical scan operations. */
  from?: TableReference;
  /** Output mappings in caller-specified order. */
  select: readonly NormalizedTableSelection[];
  /** Predicate resolved against source names before aliases. */
  where?: PredicateT;
  /** Global number of filtered rows skipped before applying the limit. */
  offset?: number;
  /** Global post-filter row limit. */
  limit?: number;
}>;

/** Logical projection retaining source names separately from output names. */
export type LogicalTableQueryProjectStep = Readonly<{
  /** Plan discriminator. */
  kind: 'project';
  /** Output mappings applied after filtering. */
  select: readonly NormalizedTableSelection[];
}>;

/** Scan, filter, aliased projection, and limit operations in execution order. */
export type LogicalTableQueryPlan<PredicateT = ColumnarPredicate> = readonly (
  | Exclude<TableQueryPlanStep<PredicateT>, {kind: 'project'}>
  | Readonly<{kind: 'offset'; offset: number}>
  | LogicalTableQueryProjectStep
)[];

/** Validates logical query fields and expands selections without modifying caller input. */
export function normalizeTableQuery<
  PredicateT extends ColumnarPredicate<unknown, ColumnarPredicateProperty> = ColumnarPredicate
>(
  sourceColumnNames: readonly string[],
  query: TableQuery<PredicateT> = {}
): NormalizedTableQuery<PredicateT> {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw new Error('Table query must be an object.');
  }
  for (const key of Object.keys(query)) {
    if (!['from', 'select', 'where', 'offset', 'limit'].includes(key)) {
      throw new Error(`Unsupported table query option: ${key}`);
    }
  }
  if (query.select !== undefined && (!Array.isArray(query.select) || query.select.length === 0)) {
    throw new Error('Table query select must be a non-empty array.');
  }
  validateTableReference(query.from);
  validateTableQueryOffset(query.offset);
  validateTableQueryLimit(query.limit);
  if (query.where !== undefined) {
    validateColumnarPredicate(query.where, new Set(sourceColumnNames));
  }
  const outputNames = new Set<string>();
  const select = (query.select ?? sourceColumnNames).map(selection => {
    if (
      typeof selection !== 'string' &&
      (!selection || typeof selection !== 'object' || Array.isArray(selection))
    ) {
      throw new Error('Table query selection must be a column name or {column, as}.');
    }
    if (
      typeof selection !== 'string' &&
      Object.keys(selection).some(key => key !== 'column' && key !== 'as')
    ) {
      throw new Error('Unsupported table query selection field.');
    }
    const column = typeof selection === 'string' ? selection : selection.column;
    const outputName =
      typeof selection === 'string'
        ? selection
        : selection.as === undefined
          ? column
          : selection.as;
    if (typeof column !== 'string' || !sourceColumnNames.includes(column)) {
      throw new Error(`Table query column not found: ${column}`);
    }
    if (typeof outputName !== 'string' || outputName.length === 0) {
      throw new Error('Table query output name must be a non-empty string.');
    }
    if (outputNames.has(outputName)) {
      throw new Error(`Duplicate table query output name: ${outputName}`);
    }
    outputNames.add(outputName);
    return Object.freeze({column, as: outputName});
  });
  // Reuse source-column and predicate validation; aliases never participate in WHERE resolution.
  planTableQuery(sourceColumnNames, {
    columns: [...new Set(select.map(selection => selection.column))],
    predicate: query.where,
    limit: query.limit
  });
  return Object.freeze({
    select: Object.freeze(select),
    ...(query.from === undefined
      ? {}
      : {from: typeof query.from === 'string' ? query.from : Object.freeze({...query.from})}),
    ...(query.where === undefined ? {} : {where: query.where}),
    ...(query.offset === undefined ? {} : {offset: query.offset}),
    ...(query.limit === undefined ? {} : {limit: query.limit})
  });
}

/** Builds a logical plan using the shared scan planner and an explicit aliased projection. */
export function planLogicalTableQuery<
  PredicateT extends ColumnarPredicate<unknown, ColumnarPredicateProperty> = ColumnarPredicate
>(
  sourceColumnNames: readonly string[],
  query: TableQuery<PredicateT> = {}
): LogicalTableQueryPlan<PredicateT> {
  const normalized = normalizeTableQuery(sourceColumnNames, query);
  const plan = planTableQuery(sourceColumnNames, {
    columns: [...new Set(normalized.select.map(selection => selection.column))],
    predicate: normalized.where,
    limit: normalized.limit
  });
  const steps: LogicalTableQueryPlan<PredicateT>[number][] = [];
  for (const step of plan) {
    if (step.kind === 'limit' && normalized.offset !== undefined)
      steps.push(Object.freeze({kind: 'offset', offset: normalized.offset}));
    steps.push(
      step.kind === 'project' ? Object.freeze({kind: 'project', select: normalized.select}) : step
    );
  }
  if (normalized.limit === undefined && normalized.offset !== undefined)
    steps.push(Object.freeze({kind: 'offset', offset: normalized.offset}));
  return Object.freeze(steps);
}

/** Validates identifiers without interpreting dots or rewriting quoted names. */
export function validateTableReference(
  reference: unknown
): asserts reference is TableReference | undefined {
  if (reference === undefined) return;
  if (typeof reference === 'string' && reference.trim()) return;
  if (reference && typeof reference === 'object' && !Array.isArray(reference)) {
    const value = reference as Record<string, unknown>;
    if (
      Object.keys(value).every(key => key === 'source' || key === 'table') &&
      typeof value.source === 'string' &&
      value.source.trim() &&
      typeof value.table === 'string' &&
      value.table.trim()
    )
      return;
  }
  throw new Error('FROM must be a source name or {source, table} with non-empty names.');
}
