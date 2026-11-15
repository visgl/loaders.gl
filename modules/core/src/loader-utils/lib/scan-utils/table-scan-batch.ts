// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ApacheArrowTable} from 'apache-arrow';
import type {ArrowTable, ArrowTableBatch, TableBatch} from '@loaders.gl/core/schema';
import type {TableScanReadOptions, TableQueryExecutionSummary} from './scan-query-metadata';
import {emitQueryComplete} from './scan-query-metadata';
import {filterColumnarRowIndices, validateColumnarPredicate} from './columnar-predicate';
import {validateTableQueryLimit, validateTableQueryOffset} from './table-query';

/** Reads source batches while allowing the shared executor to observe fetched bytes. */
export type TableScanBatchReader<BatchT = TableBatch> = (
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
) => AsyncIterable<BatchT>;

/** Optional batch kernels for formats with a native vectorized predicate implementation. */
export type TableScanBatchOperators<BatchT = TableBatch> = Readonly<{
  /** Applies a residual predicate locally or on a worker; async kernels must observe the signal. */
  filter?: (
    batch: BatchT,
    predicate: TableScanReadOptions['predicate'],
    signal?: AbortSignal
  ) => BatchT | Promise<BatchT>;
  /** Applies a projection while preserving the source batch shape. */
  project?: (batch: BatchT, columns?: readonly string[]) => BatchT;
}>;

/** Wraps an Arrow table in the standard single-result scan batch envelope. */
export function makeTableScanBatch(table: ArrowTable): ArrowTableBatch {
  return {...table, batchType: 'data', length: table.data.numRows} as ArrowTableBatch;
}

/**
 * Executes the common residual table-scan stages for row, columnar, and native Arrow chunks.
 * Native Arrow predicates require a format-supplied filter kernel.
 *
 * Format adapters provide only their parser-specific batch reader. Keeping filtering, projection,
 * limits, cancellation, and telemetry here avoids copying the same executor into every format
 * package while preserving each format's native batch shape.
 */
export async function* executeTableScanBatches<BatchT extends TableBatch | ApacheArrowTable>(
  readBatches: TableScanBatchReader<BatchT>,
  options: TableScanReadOptions &
    Readonly<{
      /** Omits empty batches from the output stream. */
      skipEmptyBatches?: boolean;
    }> = {},
  operators: TableScanBatchOperators<NoInfer<BatchT>> = {}
): AsyncIterable<BatchT> {
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
      const rowCount = getScanBatchRowCount(batch);
      rowsRead += rowCount;
      if (options.predicate && !operators.filter && !('shape' in batch)) {
        throw new Error('Native Arrow scans require a filter kernel for residual predicates.');
      }
      const filteredBatch = operators.filter
        ? await operators.filter(batch, options.predicate, options.signal)
        : (('shape' in batch ? filterTableBatch(batch, options.predicate) : batch) as BatchT);
      options.signal?.throwIfAborted();
      const filteredRowCount = getScanBatchRowCount(filteredBatch);
      if (options.predicate) {
        rowsTested += rowCount;
        rowsRetained += filteredRowCount;
      }
      if (skip >= filteredRowCount && (skip > 0 || options.skipEmptyBatches)) {
        skip -= filteredRowCount;
        continue;
      }
      const end = Math.min(filteredRowCount, skip + remaining);
      const window =
        skip || end < filteredRowCount
          ? (('shape' in filteredBatch
              ? sliceTableBatch(filteredBatch, skip, end)
              : filteredBatch.slice(skip, end)) as BatchT)
          : filteredBatch;
      skip = 0;
      const output = operators.project
        ? operators.project(window, options.columns)
        : (('shape' in window
            ? projectTableBatch(window, options.columns)
            : options.columns === undefined
              ? window
              : window.select([...options.columns])) as BatchT);
      remaining -= getScanBatchRowCount(window);
      rowsReturned += getScanBatchRowCount(output);
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

/** Reads the row count from native Arrow chunks and portable batch envelopes. */
function getScanBatchRowCount(batch: TableBatch | ApacheArrowTable): number {
  return 'shape' in batch ? batch.length : batch.numRows;
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
