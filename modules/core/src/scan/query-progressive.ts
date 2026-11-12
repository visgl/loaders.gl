// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable} from '@loaders.gl/core/schema';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import type {TableQuery} from '@loaders.gl/core/loader-utils';
import {queryInBatches, type QueryOptions} from './query';

/** Supported incremental, bounded-state aggregate operations. */
export type ProgressiveAggregate = Readonly<{
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
  /** Optional only for COUNT(*); COUNT(column) ignores nulls. */
  column?: string;
  /** Result column name. */
  as: string;
}>;

/**
 * Incremental aggregation over one table input.
 *
 * GROUP BY is intentionally a structured request: the current SQL parser does not parse
 * GROUP BY. Each snapshot is a complete replacement, not an append-only batch.
 */
export type ProgressiveAggregateQuery = Readonly<{
  from?: TableQuery['from'];
  where?: TableQuery['where'];
  groupBy?: string;
  aggregates: readonly ProgressiveAggregate[];
}>;

export type ProgressiveQueryOptions = QueryOptions & Readonly<{
  /** Emit a provisional complete table after this many nonempty input batches. Default: 1. */
  emitEveryBatches?: number;
}>;

/** Each table is independent of later updates and replaces all previous snapshots. */
export type ProgressiveQuerySnapshot = Readonly<{
  table: ArrowTable;
  rowsProcessed: number;
  final: boolean;
}>;

type AggregateState = {
  count: number;
  sum: number;
  min: number | null;
  max: number | null;
};
type GroupState = {
  key: string | number | boolean | null;
  aggregates: AggregateState[];
};

const MAX_SAFE_COUNT = Number.MAX_SAFE_INTEGER;

/**
 * Consumes Arrow batches without retaining input rows. Group state is O(number of groups).
 * Snapshot creation is O(number of groups × number of aggregates) and can be throttled
 * with emitEveryBatches. Consumer early return closes the underlying source iterator.
 */
export async function* queryProgressive(
  query: ProgressiveAggregateQuery,
  options: ProgressiveQueryOptions
): AsyncIterable<ProgressiveQuerySnapshot> {
  validateQuery(query, options);
  const {emitEveryBatches = 1, ...queryOptions} = options;
  const inputs = new Set<string>();
  if (query.groupBy) inputs.add(query.groupBy);
  for (const aggregate of query.aggregates) if (aggregate.column) inputs.add(aggregate.column);
  const columns = [...inputs];
  const groups = new Map<string | number | boolean | null, GroupState>();
  let sourceSchema: arrow.Schema | undefined;
  let rowsProcessed = 0;
  let batchesSinceEmission = 0;
  const globalGroup = query.groupBy === undefined;
  if (globalGroup) groups.set(null, makeGroup(null, query.aggregates.length));

  // A COUNT(*) request can have no input columns, but the query pipeline still needs
  // a source column to preserve row counts. The absence of select means all source
  // columns are read; no source data is retained beyond each batch.
  const tableQuery: TableQuery = {
    ...(query.from === undefined ? {} : {from: query.from}),
    ...(query.where === undefined ? {} : {where: query.where}),
    ...(columns.length ? {select: columns} : {})
  };

  for await (const batch of queryInBatches(tableQuery, {...queryOptions, queryOutput: 'batches'})) {
    options.signal?.throwIfAborted();
    sourceSchema ??= batch.data.schema;
    if (batch.length === 0) continue;
    const keyVector = query.groupBy ? batch.data.getChild(query.groupBy) : undefined;
    const aggregateVectors = query.aggregates.map(aggregate =>
      aggregate.column ? batch.data.getChild(aggregate.column) : undefined
    );
    for (let row = 0; row < batch.length; row++) {
      if ((row & 1023) === 0) options.signal?.throwIfAborted();
      const key = keyVector ? normalizeKey(keyVector.get(row)) : null;
      let group = groups.get(key);
      if (!group) {
        group = makeGroup(key, query.aggregates.length);
        groups.set(key, group);
      }
      for (let index = 0; index < query.aggregates.length; index++) {
        const operation = query.aggregates[index];
        const value = aggregateVectors[index]?.get(row);
        if (operation.function === 'count') {
          if (!operation.column || (value !== null && value !== undefined)) {
            increaseCount(group.aggregates[index]);
          }
        } else if (value !== null && value !== undefined) {
          if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw new Error(`Progressive ${operation.function} requires finite numeric values in column ${operation.column}`);
          }
          updateNumeric(group.aggregates[index], value);
        }
      }
    }
    rowsProcessed += batch.length;
    if (++batchesSinceEmission >= emitEveryBatches) {
      yield {table: createSnapshot(groups, query, sourceSchema), rowsProcessed, final: false};
      batchesSinceEmission = 0;
    }
  }

  // The terminal snapshot is always emitted, including empty inputs and when the
  // previous provisional snapshot already has the same values.
  yield {
    table: createSnapshot(groups, query, sourceSchema),
    rowsProcessed,
    final: true
  };
}

function validateQuery(query: ProgressiveAggregateQuery, options: ProgressiveQueryOptions): void {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw new Error('Progressive query must be an object.');
  }
  if (Object.keys(query).some(key => !['from', 'where', 'groupBy', 'aggregates'].includes(key))) {
    throw new Error('Unsupported progressive query field.');
  }
  if (query.groupBy !== undefined && (typeof query.groupBy !== 'string' || !query.groupBy)) {
    throw new Error('Progressive groupBy must be a nonempty column name.');
  }
  if (!Array.isArray(query.aggregates) || !query.aggregates.length) {
    throw new Error('Progressive query requires at least one aggregate.');
  }
  const names = new Set(query.groupBy ? [query.groupBy] : []);
  for (const aggregate of query.aggregates) {
    if (!aggregate || !['count', 'sum', 'avg', 'min', 'max'].includes(aggregate.function)) {
      throw new Error('Unsupported progressive aggregate function.');
    }
    if (Object.keys(aggregate).some(key => !['function', 'column', 'as'].includes(key))) {
      throw new Error('Unsupported progressive aggregate field.');
    }
    if (!aggregate.as || typeof aggregate.as !== 'string' || names.has(aggregate.as)) {
      throw new Error('Progressive aggregate aliases must be unique nonempty output names.');
    }
    if (aggregate.column !== undefined && (typeof aggregate.column !== 'string' || !aggregate.column)) {
      throw new Error('Progressive aggregate column must be nonempty.');
    }
    if (aggregate.function !== 'count' && !aggregate.column) {
      throw new Error(`Progressive ${aggregate.function} requires an input column.`);
    }
    names.add(aggregate.as);
  }
  const interval = options.emitEveryBatches ?? 1;
  if (!Number.isSafeInteger(interval) || interval <= 0) {
    throw new Error('emitEveryBatches must be a positive safe integer.');
  }
}

function makeGroup(key: GroupState['key'], length: number): GroupState {
  return {
    key,
    aggregates: Array.from({length}, () => ({count: 0, sum: 0, min: null, max: null}))
  };
}

function normalizeKey(value: unknown): GroupState['key'] {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  throw new Error('Progressive GROUP BY supports finite numeric, string, boolean, and null keys.');
}

function increaseCount(state: AggregateState): void {
  if (state.count >= MAX_SAFE_COUNT) throw new Error('Progressive aggregate count exceeds safe integer range.');
  state.count++;
}

function updateNumeric(state: AggregateState, value: number): void {
  increaseCount(state);
  state.sum += value;
  state.min = state.min === null ? value : Math.min(state.min, value);
  state.max = state.max === null ? value : Math.max(state.max, value);
}

function createSnapshot(
  groups: Map<GroupState['key'], GroupState>,
  query: ProgressiveAggregateQuery,
  sourceSchema: arrow.Schema | undefined
): ArrowTable {
  const resultColumns: Record<string, arrow.Vector> = {};
  if (query.groupBy) {
    const field = sourceSchema?.fields.find(candidate => candidate.name === query.groupBy);
    if (!field) throw new Error(`Progressive group column not found: ${query.groupBy}`);
    resultColumns[query.groupBy] = arrow.vectorFromArray(
      [...groups.values()].map(group => group.key),
      field.type
    );
  }
  for (let index = 0; index < query.aggregates.length; index++) {
    const aggregate = query.aggregates[index];
    const values = [...groups.values()].map(group => {
      const state = group.aggregates[index];
      switch (aggregate.function) {
        case 'count': return state.count;
        case 'sum': return state.count ? state.sum : null;
        case 'avg': return state.count ? state.sum / state.count : null;
        case 'min': return state.min;
        case 'max': return state.max;
      }
    });
    resultColumns[aggregate.as] = arrow.vectorFromArray(values, new arrow.Float64());
  }
  const data = new arrow.Table(resultColumns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}
