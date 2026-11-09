// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, ArrowTableBatch, TableBatch, Schema} from '@loaders.gl/core/schema';
import {
  normalizeTableQuery,
  executeTableScanBatches,
  planTableQuery,
  emitQueryComplete,
  type TableQuery,
  type TableQueryExecutionOptions,
  type TableQueryExecutionSummary,
  type TableScanSource,
  type TableScanReadOptions
} from '@loaders.gl/core/loader-utils';
import {
  convertArrowToSchema,
  convertSchemaToArrow,
  convertTableToArrow
} from '@loaders.gl/core/schema-utils';
import {projectArrowTable, filterArrowTable} from './arrow-execution';

/** Input and execution controls for one public asynchronous table query. */
export type QueryOptions = TableQueryExecutionOptions &
  Readonly<{
    /** Already loaded Arrow table or source implementing the table scan contract. */
    source: ArrowTable | TableScanSource;
  }>;

/** Collects the same ordered Arrow batch pipeline exposed by queryInBatches. */
export async function query(tableQuery: TableQuery, options: QueryOptions): Promise<ArrowTable> {
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
  tableQuery: TableQuery,
  options: QueryOptions
): AsyncIterable<ArrowTableBatch> {
  const startedAt = Date.now();
  let status: TableQueryExecutionSummary['status'] = 'early-terminated';
  let rowsRead = 0;
  let rowsReturned = 0;
  let batchesRead = 0;
  let sourcesRead = 0;
  let error: unknown;
  let earlyTerminationReason: TableQueryExecutionSummary['earlyTerminationReason'];
  try {
    options.signal?.throwIfAborted();
    const source = options.source;
    if (!source || typeof source !== 'object')
      throw new Error('Query source must be an Arrow table or table scan source.');
    const inMemory = 'shape' in source && source.shape === 'arrow-table';
    if (
      !inMemory &&
      (!('read' in source) ||
        typeof source.read !== 'function' ||
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
    const normalized = normalizeTableQuery(names, tableQuery);
    const outputColumns = [...new Set(normalized.select.map(selection => selection.column))];
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
