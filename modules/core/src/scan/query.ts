// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {SQLQuery} from '@math.gl/sql/parser';
import type {
  ProgressiveAggregateQuery,
  ProgressiveQueryOptions,
  ProgressiveQuerySnapshot
} from './query-progressive';
import {
  emitQueryComplete,
  type TableQuery,
  type TableQueryExecutionOptions,
  type TableQueryExecutionSummary,
  type TableScanSource,
  type LoaderOptions,
  type DataSourceOptions,
  type Loader,
  type DataSource
} from '@loaders.gl/core/loader-utils';
import {resolveQuerySource} from './resolve-query-source';
import {openQuerySource} from './query-open-source';
import type {SQLCatalogQuery} from './sql-catalog';

type QueryExecutor = typeof import('./query-executor');
let pendingExecutor: Promise<QueryExecutor> | undefined;

/** Shares the executor import across queries and explicit preload calls. */
function loadQueryExecutor(): Promise<QueryExecutor> {
  pendingExecutor ??= import('./query-executor').catch(error => {
    pendingExecutor = undefined;
    throw error;
  });
  return pendingExecutor;
}

/** Loads the ordinary query executor without opening a source or reading data. */
export async function preloadQuery(): Promise<void> {
  await loadQueryExecutor();
}

/** Logical table or metadata request. */
export type Query = TableQuery | SQLQuery | TypedTableQuery;

/** Numeric output types accepted by typed SELECT items. */
export type TypedColumnType =
  | 'float64'
  | 'float32'
  | 'float16'
  | 'int64'
  | 'uint64'
  | 'int32'
  | 'uint32'
  | 'int16'
  | 'uint16'
  | 'int8'
  | 'uint8';

/** Structured SELECT item that casts a named source column to a numeric width. */
export type TypedColumnSelection = Readonly<{
  /** Source column to cast. */
  column: string;
  /** Physical output type. */
  cast: TypedColumnType;
  /** Output name, defaulting to the source column name. */
  as?: string;
}>;

/** Structured query with optional typed projection items. */
export type TypedTableQuery = Omit<TableQuery, 'select'> &
  Readonly<{
    /** Ordered output columns and casts. */
    select?: readonly (
      | import('@loaders.gl/core/loader-utils').TableSelection
      | TypedColumnSelection
    )[];
  }>;

/** Injected SQL parser; core validates and executes the returned logical query. */
export type SQLQueryParser = (sql: string) => Query | Promise<Query>;

/** Input and execution controls for one public asynchronous table query. */
export type QueryOptions = TableQueryExecutionOptions &
  LoaderOptions &
  Readonly<{
    /** Source construction options, including an explicit core.name. */
    core?: DataSourceOptions['core'];
    /** Named caller-owned data sources used by FROM and metadata commands. */
    sources?: readonly DataSource<unknown, DataSourceOptions>[];
    /** Row offset belongs on the logical query. */
    offset?: never;
    /** Row limit belongs on the logical query. */
    limit?: never;
    /** Parser or lazy parser promise, required only for SQL string input. */
    sqlParser?: SQLQueryParser | Promise<SQLQueryParser>;
    /** Optional math.gl SQL functions used by locally executed expressions. */
    functions?: readonly import('@math.gl/sql/arrow').ArrowFunctionPackage[];
    /** Append-only batches (default), or complete progressive replacement snapshots. */
    queryOutput?: 'batches' | 'snapshots';
  }> &
  Readonly<
    | {
        /** Already loaded Arrow table or caller-owned table scan source. */
        source: arrow.Table | TableScanSource;
        /** URL loader selection is only used with URL sources. */
        loaders?: never;
      }
    | {
        /** FROM chooses a source from the named registry when no default source is supplied. */
        source?: undefined;
        /** Named sources available for FROM resolution. */
        sources: readonly DataSource<unknown, DataSourceOptions>[];
        /** URL loader selection requires a URL source. */
        loaders?: never;
      }
    | {
        /** URL opened lazily with the explicitly supplied source loaders. */
        source: string;
        /** URL-capable source loaders; registered loaders are never selected implicitly. */
        loaders: Loader | Loader[];
      }
  >;

/** Collects the same ordered Arrow batch pipeline exposed by queryInBatches. */
export async function query(
  tableQuery: Query | string,
  options: QueryOptions
): Promise<arrow.Table> {
  const results = runQuery(
    tableQuery,
    {...options, queryOutput: 'batches'},
    async function* collect(executor, batches) {
      const table = await executor.makeArrowTableFromBatches(batches);
      if (table) yield table;
    }
  );
  let result: arrow.Table | undefined;
  for await (const table of results) result = table;
  return result!;
}

/** Streams native Arrow batches or complete replacement snapshots. */
export async function* queryInBatches(
  tableQuery: Query | string | ProgressiveAggregateQuery,
  options: QueryOptions
): AsyncIterable<arrow.RecordBatch> {
  if (options.queryOutput === 'snapshots') {
    if (
      !tableQuery ||
      typeof tableQuery !== 'object' ||
      !('aggregates' in tableQuery) ||
      !Array.isArray(tableQuery.aggregates)
    ) {
      throw new Error('Snapshots require a structured aggregate query.');
    }
    for await (const snapshot of queryProgressive(tableQuery, options)) {
      yield* snapshot.table.batches;
    }
    return;
  }
  if (options.queryOutput !== undefined && options.queryOutput !== 'batches') {
    throw new Error('Unsupported queryOutput.');
  }
  yield* runQuery(tableQuery as Query | string, options, (_executor, batches) => batches);
}

/** Streams complete aggregate snapshots and loads the grouped executor on demand. */
export async function* queryProgressive(
  query: ProgressiveAggregateQuery,
  options: ProgressiveQueryOptions
): AsyncIterable<ProgressiveQuerySnapshot> {
  const {executeProgressiveQuery} = await import('./query-progressive');
  yield* executeProgressiveQuery(query, options);
}

/** Executes one logical query with bounded batch buffering and cooperative cancellation. */
async function* runQuery<Result>(
  tableQuery: Query | string,
  options: QueryOptions,
  consume: (
    executor: QueryExecutor,
    batches: AsyncIterable<arrow.RecordBatch>
  ) => AsyncIterable<Result>
): AsyncGenerator<Result> {
  if (typeof tableQuery === 'object' && tableQuery && 'aggregates' in tableQuery)
    throw new Error('Aggregates require snapshots.');
  const startedAt = Date.now();
  let status: TableQueryExecutionSummary['status'] = 'early-terminated';
  const metrics = {
    rowsRead: 0,
    rowsReturned: 0,
    batchesRead: 0,
    sourcesRead: 0,
    earlyTerminationReason: undefined as TableQueryExecutionSummary['earlyTerminationReason']
  };
  let error: unknown;
  let finished = false;
  let ownedSource: {close?: () => void | Promise<void>} | undefined;
  try {
    options.signal?.throwIfAborted();
    const scan = options._scan;
    if (
      options.offset !== undefined ||
      options.limit !== undefined ||
      scan?.limit !== undefined ||
      (scan && 'offset' in scan && scan.offset !== undefined)
    ) {
      throw new Error('Put offset and limit in the logical query, not the execution options.');
    }
    const [executor, prepared] = await Promise.all([loadQueryExecutor(), prepareSource()]);
    options.signal?.throwIfAborted();
    const batches = executor.executePreparedQuery(prepared, options, metrics);
    yield* consume(executor, batches);
    status = metrics.earlyTerminationReason ? 'early-terminated' : 'completed';
  } catch (failure) {
    error = failure;
    status = options.signal?.aborted ? 'cancelled' : 'failed';
    throw failure;
  } finally {
    finished = true;
    if (status === 'early-terminated' && !metrics.earlyTerminationReason)
      metrics.earlyTerminationReason = 'consumer-return';
    try {
      await ownedSource?.close?.();
    } catch (failure) {
      if (error === undefined) {
        error = failure;
        status = options.signal?.aborted ? 'cancelled' : 'failed';
        metrics.earlyTerminationReason = undefined;
        throw failure;
      }
    } finally {
      emitQueryComplete(
        options.onQueryComplete,
        Object.freeze({
          status,
          sourcesPlanned: 1,
          sourcesRead: metrics.sourcesRead,
          batchesRead: metrics.batchesRead,
          rowsRead: metrics.rowsRead,
          rowsReturned: metrics.rowsReturned,
          durationMilliseconds: Date.now() - startedAt,
          ...(metrics.earlyTerminationReason
            ? {earlyTerminationReason: metrics.earlyTerminationReason}
            : {}),
          ...(error === undefined ? {} : {error})
        })
      );
    }
  }

  /** Resolves the query input and its schema without loading the Arrow executor. */
  async function prepareSource() {
    let parsedQuery: Query;
    if (typeof tableQuery === 'string') {
      const parser = await options.sqlParser;
      options.signal?.throwIfAborted();
      if (typeof parser !== 'function') throw new Error('SQL queries require sqlParser.');
      parsedQuery = await parser(tableQuery);
      options.signal?.throwIfAborted();
    } else parsedQuery = tableQuery;
    if (!parsedQuery || typeof parsedQuery !== 'object' || Array.isArray(parsedQuery))
      throw new Error('Table query must be an object.');
    if (finished) throw new Error('Query preparation ended.');
    const normalizedQuery = await normalizeTypedQuery(parsedQuery);
    const castPredicate =
      'command' in normalizedQuery ? false : validatePredicateOperands(normalizedQuery.where);
    let logicalQuery: TableQuery | Exclude<SQLQuery, SQLCatalogQuery>;
    let source: unknown;
    if ('command' in parsedQuery) {
      logicalQuery = {};
      source = (await import('./catalog-query-source')).createCatalogQuerySource(
        parsedQuery,
        options.sources
      );
    } else {
      logicalQuery = normalizedQuery as Exclude<SQLQuery, SQLCatalogQuery>;
      source =
        logicalQuery.from === undefined
          ? options.source
          : await resolveQuerySource(logicalQuery.from, options.sources, options.signal);
    }
    if (finished) throw new Error('Query preparation ended.');
    if (logicalQuery.from === undefined && typeof source === 'string') {
      const opened = await openQuerySource(options);
      if (
        opened &&
        typeof opened === 'object' &&
        'close' in opened &&
        typeof opened.close === 'function'
      ) {
        const created = opened as {close: () => void | Promise<void>};
        if (finished) {
          await created.close();
          throw new Error('Query preparation ended.');
        }
        ownedSource = created;
      }
      source = opened;
    }
    options.signal?.throwIfAborted();
    if (!source || typeof source !== 'object')
      throw new Error('Expected an Arrow table or table scan source.');
    const inMemory = 'batches' in source ? (source as arrow.Table) : null;
    if (
      !inMemory &&
      (!('read' in source) ||
        typeof source.read !== 'function' ||
        !('getQueryMetadata' in source) ||
        typeof source.getQueryMetadata !== 'function')
    ) {
      throw new Error('Expected an Arrow table or table scan source.');
    }
    const metadata = inMemory
      ? undefined
      : await (source as TableScanSource).getQueryMetadata({signal: options.signal});
    options.signal?.throwIfAborted();
    if (
      metadata &&
      (metadata.queryType !== 'table' ||
        metadata.execution.status !== 'supported' ||
        metadata.execution.method !== 'read')
    ) {
      throw new Error('Query source must support table reads.');
    }
    if (metadata?.hasDefaultRowWindow) {
      throw new Error(
        'Query source has a default offset or limit. Remove the source defaults and put offset and limit in the logical query.'
      );
    }
    return {
      logicalQuery,
      source,
      inMemory,
      metadata,
      castPredicate,
      catalogQuery: 'command' in parsedQuery
    };
  }
}

/** Lowers structured casts to the same AST consumed by SQL and Arrow. */
async function normalizeTypedQuery(query: Query): Promise<SQLQuery | TableQuery> {
  if (
    'command' in query ||
    !Array.isArray(query.select) ||
    !query.select.some(item => item && typeof item === 'object' && 'cast' in item)
  ) {
    return query as SQLQuery | TableQuery;
  }
  return (await import('./arrow-execution/expressions')).normalizeTypedProjection(query);
}

/** Checks predicate tree bounds and detects casts that require Arrow execution. */
function validatePredicateOperands(where: unknown): boolean {
  if (where && typeof where === 'object' && 'expression' in where) {
    if (Object.keys(where).some(key => key !== 'expression'))
      throw new Error('Unsupported computed WHERE field.');
    return false;
  }
  let castPredicate = false;
  const pending: {value: unknown; exit?: boolean}[] = where ? [{value: where}] : [];
  const visited = new WeakSet<object>();
  let nodes = 0;
  while (pending.length) {
    const frame = pending.pop()!;
    const candidate = frame.value;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    if (frame.exit) {
      visited.delete(candidate);
      continue;
    }
    if (visited.has(candidate) || ++nodes > 4096)
      throw new Error('Query predicate must be an acyclic tree of at most 4096 nodes.');
    visited.add(candidate);
    if (isUnsupportedQueryExpression(candidate))
      throw new Error('CAST and computed WHERE operands are not supported by this query executor.');
    const predicate = candidate as {op?: unknown; args?: unknown};
    if (!Array.isArray(predicate.args)) continue;
    if (predicate.op === 'and' || predicate.op === 'or' || predicate.op === 'not') {
      if (predicate.args.length > 4096 - nodes)
        throw new Error('Query predicate exceeds 4096 nodes.');
      pending.push({value: candidate, exit: true});
      pending.push(...predicate.args.map(value => ({value})));
      continue;
    }
    visited.delete(candidate);
    for (const [index, operand] of predicate.args.entries()) {
      if (
        index === 0 &&
        operand &&
        typeof operand === 'object' &&
        typeof operand.property === 'string' &&
        'casts' in operand
      ) {
        castPredicate = true;
        continue;
      }
      if (
        isUnsupportedQueryExpression(operand) ||
        (Array.isArray(operand) && operand.some(isUnsupportedQueryExpression))
      )
        throw new Error(
          'CAST and computed WHERE operands are not supported by this query executor.'
        );
    }
  }
  return castPredicate;
}

/** Identifies newer portable operands and raw expression ASTs without interpreting scalar values. */
function isUnsupportedQueryExpression(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if ('casts' in value || 'expression' in value) return true;
  return (
    'type' in value &&
    typeof value.type === 'string' &&
    /Expression$|^(Identifier|Literal|Compound)$/.test(value.type)
  );
}

export {parseSQLQuery, parseSQLSelect, type SQLSelectParserOptions} from '@math.gl/sql/parser';

export {createSQLCatalog} from './sql-catalog';
export type {SQLCatalog, SQLCatalogQuery, SQLCatalogSource, SQLCatalogTable} from './sql-catalog';
