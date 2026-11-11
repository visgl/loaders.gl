// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, TableBatch} from '@loaders.gl/core/schema';
import type {TableScanReadOptions, TableQueryExecutionSummary} from './scan-query-metadata';
import {emitQueryComplete} from './scan-query-metadata';
import {filterColumnarRowIndices, validateColumnarPredicate} from './columnar-predicate';
import {validateTableQueryLimit, validateTableQueryOffset} from './table-query';

/** Reads source batches while allowing the shared executor to observe fetched bytes. */
export type TableScanBatchReader = (
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
) => AsyncIterable<TableBatch>;

/** Optional batch kernels for formats with a native vectorized predicate implementation. */
export type TableScanBatchOperators = Readonly<{
  /** Applies a residual predicate locally or on a worker; async kernels must observe the signal. */
  filter?: (
    batch: TableBatch,
    predicate: TableScanReadOptions['predicate'],
    signal?: AbortSignal
  ) => TableBatch | Promise<TableBatch>;
  /** Applies a projection while preserving the source batch shape. */
  project?: (batch: TableBatch, columns?: readonly string[]) => TableBatch;
}>;

/** Wraps an Arrow table in the standard single-result scan batch envelope. */
export function makeTableScanBatch(table: ArrowTable): ArrowTableBatch {
  return {...table, batchType: 'data', length: table.data.numRows} as ArrowTableBatch;
}

/**
 * Executes the common residual table-scan stages for row and columnar batches.
 *
 * Format adapters provide only their parser-specific batch reader. Keeping filtering, projection,
 * limits, cancellation, and telemetry here avoids copying the same executor into every format
 * package while preserving each format's native batch shape.
 */
export async function* executeTableScanBatches(
  readBatches: TableScanBatchReader,
  options: TableScanReadOptions &
    Readonly<{
      /** Number of rows to skip after residual filtering. */
      offset?: number;
      /** Omits empty batches from the output stream. */
      skipEmptyBatches?: boolean;
    }> = {},
  operators: TableScanBatchOperators = {}
): AsyncIterable<TableBatch> {
  validateTableQueryLimit(options.limit);
  validateTableQueryOffset(options.offset);
  let skip = options.offset ?? 0;
  const startedAt = Date.now();
  let sourcesRead = 0;
  let batchesRead = 0;
  let rowsRead = 0;
  let rowsTested = 0;
  let rowsRetained = 0;
  let rowsReturned = 0;
  let bytesFetched = 0;
  let status: TableQueryExecutionSummary['status'] = 'early-terminated';
  let earlyTerminationReason: TableQueryExecutionSummary['earlyTerminationReason'];
  let executionError: unknown;
  let remaining =
    options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
  try {
    options.signal?.throwIfAborted();
    if (remaining <= 0) {
      earlyTerminationReason = 'limit';
      return;
    }
    sourcesRead = 1;
    for await (const batch of readBatches(
      options.signal,
      byteLength => (bytesFetched += byteLength)
    )) {
      if (remaining <= 0) {
        earlyTerminationReason = 'limit';
        return;
      }
      options.signal?.throwIfAborted();
      batchesRead++;
      rowsRead += batch.length;
      const filteredBatch = await (operators.filter || filterTableBatch)(
        batch,
        options.predicate,
        options.signal
      );
      options.signal?.throwIfAborted();
      if (options.predicate) {
        rowsTested += batch.length;
        rowsRetained += filteredBatch.length;
      }
      if (skip >= filteredBatch.length && (skip > 0 || options.skipEmptyBatches)) {
        skip -= filteredBatch.length;
        continue;
      }
      const end = Math.min(filteredBatch.length, skip + remaining);
      const window =
        skip || end < filteredBatch.length
          ? sliceTableBatch(filteredBatch, skip, end)
          : filteredBatch;
      skip = 0;
      const output = (operators.project || projectTableBatch)(window, options.columns);
      remaining -= window.length;
      rowsReturned += output.length;
      if (remaining === 0) earlyTerminationReason = 'limit';
      yield output;
      if (remaining === 0) return;
      options.signal?.throwIfAborted();
    }
    status = 'completed';
  } catch (error) {
    status = options.signal?.aborted ? 'cancelled' : 'failed';
    executionError = error;
    throw error;
  } finally {
    if (status === 'early-terminated' && !earlyTerminationReason) {
      earlyTerminationReason = 'consumer-return';
    }
    emitQueryComplete(
      options.onQueryComplete,
      Object.freeze({
        status,
        sourcesPlanned: 1,
        sourcesRead,
        batchesRead,
        batchesDecoded: batchesRead,
        rowsRead,
        rowsTested: rowsTested || undefined,
        rowsRetained: rowsRetained || undefined,
        rowsReturned,
        bytesRead: bytesFetched,
        bytesFetched,
        filesOpened: sourcesRead,
        tasksOpened: sourcesRead,
        durationMilliseconds: Date.now() - startedAt,
        earlyTerminationReason,
        ...(executionError === undefined ? {} : {error: executionError})
      })
    );
  }
}

/** Truncates a batch without changing its native representation. */
export function truncateTableBatch(batch: TableBatch, length: number): TableBatch {
  return sliceTableBatch(batch, 0, length);
}

/** Slices rows in a batch, preserving Arrow buffers and the batch shape. */
function sliceTableBatch(batch: TableBatch, start: number, end: number): TableBatch {
  const length = end - start;
  if (batch.shape === 'object-row-table' || batch.shape === 'array-row-table') {
    return {...batch, data: batch.data.slice(start, end), length} as TableBatch;
  }
  if (batch.shape === 'columnar-table') {
    return {
      ...batch,
      data: Object.fromEntries(
        Object.entries(batch.data).map(([name, values]) => [
          name,
          Array.from(values as ArrayLike<unknown>).slice(start, end)
        ])
      ),
      length
    };
  }
  if (batch.shape === 'arrow-table') return {...batch, data: batch.data.slice(start, end), length};
  return {...batch, features: batch.features.slice(start, end), length};
}

/** Projects a batch in the caller-requested order while preserving its shape. */
export function projectTableBatch(batch: TableBatch, columns?: readonly string[]): TableBatch {
  if (columns === undefined) return batch;
  const schema = projectTableSchema(batch, columns);
  if (batch.shape === 'object-row-table') {
    return {
      ...batch,
      schema,
      data: batch.data.map(row => Object.fromEntries(columns.map(column => [column, row[column]])))
    } as TableBatch;
  }
  if (batch.shape === 'columnar-table') {
    return {
      ...batch,
      schema,
      data: Object.fromEntries(columns.map(column => [column, batch.data[column]]))
    };
  }
  if (batch.shape === 'arrow-table')
    return {...batch, schema, data: batch.data.select([...columns])};
  return batch;
}

/** Retains portable schema fields in the caller-requested projection order. */
export function projectTableSchema(
  batch: TableBatch,
  columns: readonly string[]
): TableBatch['schema'] {
  if (!batch.schema) return undefined;
  const fieldsByName = new Map(batch.schema.fields.map(field => [field.name, field]));
  return {
    ...batch.schema,
    fields: columns.flatMap(column => {
      const field = fieldsByName.get(column);
      return field ? [field] : [];
    })
  };
}

/** Applies a portable residual predicate to object-row batches. */
export function filterTableBatch(
  batch: TableBatch,
  predicate: TableScanReadOptions['predicate']
): TableBatch {
  if (!predicate || batch.shape !== 'object-row-table') return batch;
  const rows = batch.data;
  const columnNames = new Set(batch.schema?.fields.map(field => field.name) || []);
  validateColumnarPredicate(predicate, columnNames);
  const columns = Object.fromEntries(
    [...columnNames].map(name => [name, rows.map(row => row[name])])
  );
  const rowIndices = filterColumnarRowIndices(predicate as never, columns, rows.length);
  return {...batch, data: rowIndices.map(rowIndex => rows[rowIndex]), length: rowIndices.length};
}
