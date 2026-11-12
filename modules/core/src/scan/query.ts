// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  ProgressiveAggregateQuery,
  ProgressiveQueryOptions,
  ProgressiveQuerySnapshot
} from './query-progressive';
import type {SQLQuery} from '@math.gl/expressions/sql';
import type {ArrowTable, ArrowTableBatch, TableBatch, Schema} from '@loaders.gl/core/schema';
import {
  normalizeTableQuery,
  getColumnarPredicateColumns,
  executeTableScanBatches,
  planTableQuery,
  emitQueryComplete,
  type TableQuery,
  type TableQueryExecutionOptions,
  type TableQueryExecutionSummary,
  type TableScanSource,
  type TableScanReadOptions,
  type LoaderOptions,
  type DataSourceOptions,
  type SourceLoader,
  resolveLoaderAuthenticationOptions,
  isSourceLoader
} from '@loaders.gl/core/loader-utils';
import {
  convertArrowToSchema,
  convertSchemaToArrow,
  convertTableToArrow
} from '@loaders.gl/core/schema-utils';
import {projectArrowTable, filterArrowTable} from './arrow-execution';
import {filterArrowRows} from './arrow-execution/filter-arrow-table';
import {createCatalogQuerySource} from './catalog-query-source';
import type {SQLCatalogQuery} from './sql-catalog';
import {resolveQuerySource} from './resolve-query-source';
import type {DataSource} from '@loaders.gl/core/loader-utils';

/** Logical table or metadata request. */
export type Query = TableQuery | SQLQuery;

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
    /** Parser or lazy parser promise, required only for SQL string input. */
    sqlParser?: SQLQueryParser | Promise<SQLQueryParser>;
    /** Append-only batches (default), or complete progressive replacement snapshots. */
    queryOutput?: 'batches' | 'snapshots';
  }> &
  Readonly<
    | {
        /** Already loaded Arrow table or caller-owned table scan source. */
        source: ArrowTable | TableScanSource;
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
        loaders: SourceLoader | SourceLoader[];
      }
  >;

/** Collects the same ordered Arrow batch pipeline exposed by queryInBatches. */
export async function query(
  tableQuery: Query | string,
  options: QueryOptions
): Promise<ArrowTable> {
  let schema: arrow.Schema | undefined;
  const batches: arrow.RecordBatch[] = [];
  for await (const batch of queryInBatches(tableQuery, {...options, queryOutput: undefined})) {
    schema = batch.data.schema;
    batches.push(...batch.data.batches);
  }
  const data = new arrow.Table(schema!, batches);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}

/**
 * Without queryOutput, preserves the legacy loaders.gl ArrowTableBatch envelope.
 * With queryOutput, yields pure Arrow RecordBatch objects. Each snapshot replaces
 * all earlier snapshots; batches are append-only.
 */
export function queryInBatches(
  tableQuery: ProgressiveAggregateQuery,
  options: QueryOptions & {queryOutput: 'snapshots'; emitEveryBatches?: number}
): AsyncIterable<arrow.RecordBatch>;
export function queryInBatches(
  tableQuery: Query | string,
  options: QueryOptions & {queryOutput: 'batches'}
): AsyncIterable<arrow.RecordBatch>;
export function queryInBatches(
  tableQuery: Query | string,
  options: QueryOptions & {queryOutput?: undefined}
): AsyncIterable<ArrowTableBatch>;
export function queryInBatches(
  tableQuery: Query | string | ProgressiveAggregateQuery,
  options: QueryOptions
): AsyncIterable<ArrowTableBatch | arrow.RecordBatch>;
export async function* queryInBatches(
  tableQuery: Query | string | ProgressiveAggregateQuery,
  options: QueryOptions
): AsyncIterable<ArrowTableBatch | arrow.RecordBatch> {
  if (options.queryOutput === 'snapshots') {
    if (
      !tableQuery ||
      typeof tableQuery !== 'object' ||
      !('aggregates' in tableQuery) ||
      !Array.isArray(tableQuery.aggregates)
    ) {
      throw new Error('Snapshot query output currently requires a structured aggregate query.');
    }
    for await (const snapshot of queryProgressive(tableQuery, options)) {
      yield* snapshot.table.data.batches;
    }
    return;
  }
  if (options.queryOutput !== undefined && options.queryOutput !== 'batches') {
    throw new Error('Unsupported queryOutput; expected batches or snapshots.');
  }
  if (typeof tableQuery === 'object' && tableQuery && 'aggregates' in tableQuery) {
    throw new Error('Aggregate queries require queryOutput: snapshots.');
  }
  for await (const batch of queryAppendBatches(tableQuery as Query | string, options)) {
    if (options.queryOutput === 'batches') {
      yield* batch.data.batches;
    } else {
      yield batch;
    }
  }
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
async function* queryAppendBatches(
  tableQuery: Query | string,
  options: QueryOptions
): AsyncIterable<ArrowTableBatch> {
  const startedAt = Date.now();
  let status: TableQueryExecutionSummary['status'] = 'early-terminated';
  let rowsRead = 0;
  let rowsReturned = 0;
  let batchesRead = 0;
  let sourcesRead = 0;
  let error: unknown;
  let ownedSource: {close?: () => void | Promise<void>} | undefined;
  let earlyTerminationReason: TableQueryExecutionSummary['earlyTerminationReason'];
  try {
    options.signal?.throwIfAborted();
    let parsedQuery: Query;
    if (typeof tableQuery === 'string') {
      const parser = await options.sqlParser;
      options.signal?.throwIfAborted();
      if (typeof parser !== 'function')
        throw new Error('SQL queries require a sqlParser function or promise.');
      parsedQuery = await parser(tableQuery);
      options.signal?.throwIfAborted();
    } else parsedQuery = tableQuery;
    if (!parsedQuery || typeof parsedQuery !== 'object' || Array.isArray(parsedQuery))
      throw new Error('Table query must be an object.');
    const castPredicate =
      'command' in parsedQuery ? false : validatePredicateOperands(parsedQuery.where);
    let logicalQuery: TableQuery | Exclude<SQLQuery, SQLCatalogQuery>;
    let source: unknown;
    if ('command' in parsedQuery) {
      logicalQuery = {};
      source = createCatalogQuerySource(parsedQuery, options.sources);
    } else {
      logicalQuery = parsedQuery;
      source =
        logicalQuery.from === undefined
          ? options.source
          : await resolveQuerySource(logicalQuery.from, options.sources, options.signal);
    }
    if (logicalQuery.from === undefined && typeof source === 'string') {
      const opened = await openQuerySource(options);
      if (
        opened &&
        typeof opened === 'object' &&
        'close' in opened &&
        typeof opened.close === 'function'
      )
        ownedSource = opened as {close: () => void | Promise<void>};
      source = opened;
    }
    options.signal?.throwIfAborted();
    if (!source || typeof source !== 'object')
      throw new Error('Query source must be an Arrow table or table scan source.');
    const inMemory = 'shape' in source && source.shape === 'arrow-table';
    if (
      !inMemory &&
      (!('read' in source) ||
        typeof source.read !== 'function' ||
        !('getQueryMetadata' in source) ||
        typeof source.getQueryMetadata !== 'function')
    ) {
      throw new Error('Query source must be an Arrow table or table scan source.');
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
    const sourceSchema = inMemory
      ? (source as ArrowTable).data.schema
      : convertSchemaToArrow(metadata!.schema);
    const names = sourceSchema.fields.map(field => field.name);
    const {select, where, ...controls} = logicalQuery;
    const computedProjection =
      Array.isArray(select) &&
      select.some(
        selection =>
          selection &&
          typeof selection === 'object' &&
          ('expression' in selection || 'array' in selection)
      );
    const expressionFilter =
      where && typeof where === 'object' && 'expression' in where ? where : undefined;
    const portablePredicate = expressionFilter ? undefined : (where as TableQuery['where']);
    const normalized = normalizeTableQuery(names, {
      ...controls,
      select: computedProjection ? undefined : (select as TableQuery['select']),
      where: castPredicate ? undefined : portablePredicate
    });
    const expressionTools =
      computedProjection || expressionFilter || castPredicate
        ? await import('./arrow-execution/expressions')
        : undefined;
    const outputColumns = computedProjection
      ? expressionTools!.getProjectionColumns(select!)
      : normalized.select.map(selection => selection.column);
    const expressionColumns = expressionFilter
      ? expressionTools!.getExpressionColumns(expressionFilter.expression)
      : castPredicate && portablePredicate
        ? getColumnarPredicateColumns(portablePredicate)
        : [];
    const required = [...new Set([...outputColumns, ...expressionColumns])];
    const plan = planTableQuery(names, {
      // A literal-only projection still needs a physical column to retain row counts.
      columns: required.length ? required : names.slice(0, 1),
      predicate: normalized.where
    });
    const requiredColumns = plan[0].kind === 'scan' ? plan[0].columns : names;
    const capabilities = metadata?.capabilities.table;
    // read() must perform exact filtering when it advertises pushdown+residual, not only pruning.
    const delegatePredicate = Boolean(
      normalized.where &&
        capabilities &&
        ['pushdown', 'pushdown+residual'].includes(capabilities.predicate)
    );
    const residual = delegatePredicate ? undefined : normalized.where;
    const requestedRows =
      normalized.limit === undefined ? undefined : (normalized.offset ?? 0) + normalized.limit;
    const readOptions: TableScanReadOptions = {
      signal: options.signal,
      ...(capabilities && capabilities.projection !== 'unsupported'
        ? {columns: requiredColumns}
        : {}),
      ...(delegatePredicate ? {predicate: normalized.where} : {}),
      ...(!residual &&
      !expressionFilter &&
      !castPredicate &&
      requestedRows !== undefined &&
      Number.isSafeInteger(requestedRows) &&
      capabilities &&
      ['pushdown', 'pushdown+residual'].includes(capabilities.limit)
        ? {limit: requestedRows}
        : {})
    };
    const inputSchema = readOptions.columns
      ? sourceSchema.select([...readOptions.columns])
      : sourceSchema;
    const readSchema = convertArrowToSchema(inputSchema);
    const comparisonInputSchema = expressionTools ? convertSchemaToArrow(readSchema) : undefined;
    const compiledFilter = expressionFilter
      ? expressionTools!.compileArrowExpression(expressionFilter.expression, {inputSchema})
      : castPredicate && portablePredicate
        ? expressionTools!.compileArrowPredicate(portablePredicate, {inputSchema})
        : undefined;
    if (compiledFilter && !arrow.DataType.isBool(compiledFilter.outputField.type))
      throw new Error('SQL WHERE expression must return Boolean.');
    const project = computedProjection
      ? expressionTools!.compileArrowProjection(inputSchema, select!, options.signal)
      : (data: arrow.Table) => projectArrowTable(data, normalized.select);
    const empty = project(new arrow.Table(inputSchema));
    const comparisonSchema = convertSchemaToArrow(convertArrowToSchema(empty.schema));
    let emitted = false;
    /** Adapts physical batches without pulling ahead of the query consumer. */
    async function* inputs(): AsyncIterable<ArrowTableBatch> {
      sourcesRead = 1;
      const batches: AsyncIterable<unknown> = inMemory
        ? memoryBatches((source as ArrowTable).data)
        : (source as TableScanSource).read(readOptions);
      for await (const value of batches) {
        options.signal?.throwIfAborted();
        let batch = normalizeBatch(value, readSchema);
        if (
          comparisonInputSchema &&
          !arrow.util.compareSchemas(comparisonInputSchema, convertSchemaToArrow(batch.schema!))
        ) {
          // A source may return a wider or differently ordered projection than requested.
          const data = batch.data.select(inputSchema.names);
          batch = {...batch, ...wrapBatch(data)};
          if (
            !arrow.util.compareSchemas(comparisonInputSchema, convertSchemaToArrow(batch.schema!))
          )
            throw new Error('Query input schema does not match source metadata.');
        }
        batchesRead++;
        rowsRead += batch.length;
        yield batch;
      }
    }
    for await (const value of executeTableScanBatches(
      () => inputs(),
      {
        predicate: residual,
        offset: normalized.offset,
        limit: normalized.limit,
        skipEmptyBatches: true,
        signal: options.signal
      },
      {
        filter: (batch, predicate, signal) => {
          const input = batch as ArrowTableBatch;
          const data = compiledFilter
            ? filterArrowRows(
                input.data,
                batch => {
                  const matches = compiledFilter.evaluate(batch, {signal});
                  return index => matches.get(index) === true;
                },
                {signal}
              )
            : predicate
              ? filterArrowTable(input.data, predicate, {signal})
              : input.data;
          return {...input, ...wrapBatch(data)};
        },
        project: batch => {
          const input = batch as ArrowTableBatch;
          return computedProjection ? input : {...input, ...wrapBatch(project(input.data))};
        }
      }
    )) {
      const input = value as ArrowTableBatch;
      const batch = computedProjection ? {...input, ...wrapBatch(project(input.data))} : input;
      if (!arrow.util.compareSchemas(comparisonSchema, convertSchemaToArrow(batch.schema!)))
        throw new Error('Query output schema does not match source metadata.');
      emitted = true;
      rowsReturned += batch.length;
      yield batch;
    }
    // An empty schema-bearing batch makes collected and streaming empty results identical.
    if (!emitted) yield wrapBatch(empty);
    if (normalized.limit !== undefined && rowsReturned >= normalized.limit)
      earlyTerminationReason = 'limit';
    status = earlyTerminationReason ? 'early-terminated' : 'completed';
  } catch (failure) {
    error = failure;
    status = options.signal?.aborted ? 'cancelled' : 'failed';
    throw failure;
  } finally {
    if (status === 'early-terminated' && !earlyTerminationReason)
      earlyTerminationReason = 'consumer-return';
    try {
      await ownedSource?.close?.();
    } catch (failure) {
      if (error === undefined) {
        error = failure;
        status = options.signal?.aborted ? 'cancelled' : 'failed';
        earlyTerminationReason = undefined;
        throw failure;
      }
    } finally {
      emitQueryComplete(
        options.onQueryComplete,
        Object.freeze({
          status,
          sourcesPlanned: 1,
          sourcesRead,
          batchesRead,
          rowsRead,
          rowsReturned,
          durationMilliseconds: Date.now() - startedAt,
          ...(earlyTerminationReason ? {earlyTerminationReason} : {}),
          ...(error === undefined ? {} : {error})
        })
      );
    }
  }
}

/** Emits original Arrow RecordBatches without copying their buffers. */
async function* memoryBatches(data: arrow.Table): AsyncIterable<ArrowTableBatch> {
  for (const batch of data.batches) yield wrapBatch(new arrow.Table(data.schema, [batch]));
}

/** Converts supported native table batches to Arrow while preserving their declared schema. */
function normalizeBatch(value: unknown, fallbackSchema: Schema): ArrowTableBatch {
  if (!value || typeof value !== 'object' || !('shape' in value))
    throw new Error('Query source returned an unsupported batch.');
  const input = value as TableBatch;
  const batch = {...input, schema: input.schema ?? fallbackSchema} as TableBatch;
  if (
    !['arrow-table', 'object-row-table', 'array-row-table', 'columnar-table'].includes(batch.shape)
  )
    throw new Error(`Unsupported query batch shape: ${batch.shape}`);
  const data =
    batch.length === 0 && batch.schema
      ? new arrow.Table(convertSchemaToArrow(batch.schema))
      : convertTableToArrow(batch);
  return {...batch, ...wrapBatch(data)} as ArrowTableBatch;
}

/** Wraps Arrow data in the standard batch envelope. */
function wrapBatch(data: arrow.Table): ArrowTableBatch {
  return {
    shape: 'arrow-table',
    data,
    schema: convertArrowToSchema(data.schema),
    batchType: 'data',
    length: data.numRows
  } as ArrowTableBatch;
}

/** Opens only explicit URL source loaders; the public query owns the returned source. */
async function openQuerySource(options: QueryOptions): Promise<unknown> {
  const candidates = Array.isArray(options.loaders) ? options.loaders : [options.loaders];
  if (!candidates.length || candidates.some(loader => !isSourceLoader(loader) || !loader.fromUrl))
    throw new Error('Query source must specify explicit URL-capable source loaders for a URL.');
  const {source, sources, loaders, sqlParser, onQueryComplete, queryOutput, ...sourceOptions} = options;
  const url = source as string;
  const selected =
    candidates.length === 1 ? candidates[0]! : candidates.find(loader => loader!.testURL(url));
  if (!selected) throw new Error('No explicit source loader matches the query URL.');
  const implementation = selected.preload ? await selected.preload(url, sourceOptions) : selected;
  options.signal?.throwIfAborted();
  if (!isSourceLoader(implementation) || !implementation.fromUrl)
    throw new Error('Query source preload did not return a URL-capable source loader.');
  const authenticatedOptions = await resolveLoaderAuthenticationOptions(
    selected.getAuthentications ? selected : implementation,
    url,
    {...sourceOptions, core: {...sourceOptions.core, ignoreRegisteredLoaders: true}}
  );
  options.signal?.throwIfAborted();
  return implementation.createDataSourceSync(url, authenticatedOptions as DataSourceOptions);
}

export {parseSQLQuery, parseSQLSelect, type SQLSelectParserOptions} from '@math.gl/expressions/sql';

export {createSQLCatalog} from './sql-catalog';
export type {SQLCatalog, SQLCatalogQuery, SQLCatalogSource, SQLCatalogTable} from './sql-catalog';

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
