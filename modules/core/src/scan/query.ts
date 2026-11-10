// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, ArrowTableBatch, TableBatch, Schema} from '@loaders.gl/core/schema';
import {
  normalizeTableQuery,
  getSelectionColumns,
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
import {createCatalogQuerySource} from './catalog-query-source';
import type {SQLCatalogQuery} from './sql-catalog';
import {resolveQuerySource} from './resolve-query-source';
import type {DataSource} from '@loaders.gl/core/loader-utils';

/** Logical table or metadata request. */
export type Query = TableQuery | SQLCatalogQuery;

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
  for await (const batch of queryInBatches(tableQuery, options)) {
    schema = batch.data.schema;
    batches.push(...batch.data.batches);
  }
  const data = new arrow.Table(schema!, batches);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}

/** Executes one logical query with bounded batch buffering and cooperative cancellation. */
export async function* queryInBatches(
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
    let logicalQuery: TableQuery;
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
    const normalized = normalizeTableQuery(names, logicalQuery);
    const outputColumns = [...new Set(normalized.select.flatMap(selection => [...getSelectionColumns(selection)]))];
    const plan = planTableQuery(names, {columns: outputColumns, predicate: normalized.where});
    const requiredColumns = plan[0].kind === 'scan' ? plan[0].columns : names;
    const capabilities = metadata?.capabilities.table;
    // read() must perform exact filtering when it advertises pushdown+residual, not only pruning.
    const delegatePredicate = Boolean(
      normalized.where &&
        capabilities &&
        ['pushdown', 'pushdown+residual'].includes(capabilities.predicate)
    );
    const residual = delegatePredicate ? undefined : normalized.where;
    const readOptions: TableScanReadOptions = {
      signal: options.signal,
      ...(capabilities && capabilities.projection !== 'unsupported'
        ? {columns: requiredColumns}
        : {}),
      ...(delegatePredicate ? {predicate: normalized.where} : {}),
      ...(!residual &&
      capabilities &&
      ['pushdown', 'pushdown+residual'].includes(capabilities.limit)
        ? {limit: normalized.limit}
        : {})
    };
    const readSchema = convertArrowToSchema(
      readOptions.columns ? sourceSchema.select([...readOptions.columns]) : sourceSchema
    );
    const empty = projectArrowTable(new arrow.Table(sourceSchema), normalized.select);
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
        const batch = normalizeBatch(value, readSchema);
        batchesRead++;
        rowsRead += batch.length;
        yield batch;
      }
    }
    for await (const value of executeTableScanBatches(
      () => inputs(),
      {
        predicate: residual,
        limit: normalized.limit,
        signal: options.signal
      },
      {
        filter: (batch, predicate, signal) => {
          const input = batch as ArrowTableBatch;
          const data = predicate ? filterArrowTable(input.data, predicate, {signal}) : input.data;
          return {...input, ...wrapBatch(data)};
        },
        project: batch => {
          const input = batch as ArrowTableBatch;
          return {...input, ...wrapBatch(projectArrowTable(input.data, normalized.select))};
        }
      }
    )) {
      const batch = value as ArrowTableBatch;
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
  const {source, sources, loaders, sqlParser, onQueryComplete, ...sourceOptions} = options;
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
  return implementation.createDataSource(url, authenticatedOptions as DataSourceOptions);
}

export {parseSQLQuery} from './parse-sql-query';
export {parseSQLSelect} from './parse-sql-select';
export type {SQLSelectParserOptions} from './parse-sql-select';

export {createSQLCatalog} from './sql-catalog';
export type {SQLCatalog, SQLCatalogQuery, SQLCatalogSource, SQLCatalogTable} from './sql-catalog';
