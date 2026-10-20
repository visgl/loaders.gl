// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, TableBatch} from '@loaders.gl/schema';
import type {TableScanReadOptions, ScanExecutionTelemetry} from './scan-query-metadata';
import {emitScanExecutionTelemetry} from './scan-query-metadata';
import {filterColumnarRowIndices, validateColumnarPredicate} from './columnar-predicate';
import {validateTableQueryLimit} from './table-query';

/** Reads source batches while allowing the shared executor to observe fetched bytes. */
export type TableScanBatchReader = (
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
) => AsyncIterable<TableBatch>;

/** Optional batch kernels for formats with a native vectorized predicate implementation. */
export type TableScanBatchOperators = Readonly<{
  /** Applies a residual predicate while preserving the source batch shape. */
  filter?: (batch: TableBatch, predicate: TableScanReadOptions['predicate']) => TableBatch;
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
  options: TableScanReadOptions = {},
  operators: TableScanBatchOperators = {}
): AsyncIterable<TableBatch> {
  validateTableQueryLimit(options.limit);
  const startedAt = Date.now();
  let sourcesRead = 0;
  let batchesRead = 0;
  let rowsRead = 0;
  let rowsTested = 0;
  let rowsRetained = 0;
  let rowsReturned = 0;
  let bytesFetched = 0;
  let status: ScanExecutionTelemetry['status'] = 'early-terminated';
  let earlyTerminationReason: ScanExecutionTelemetry['earlyTerminationReason'];
  let executionError: unknown;
  let remaining =
    options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
  try {
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
      batchesRead++;
      rowsRead += batch.length;
      const filteredBatch = (operators.filter || filterTableBatch)(batch, options.predicate);
      if (options.predicate) {
        rowsTested += batch.length;
        rowsRetained += filteredBatch.length;
      }
      const projectedBatch = (operators.project || projectTableBatch)(
        filteredBatch,
        options.columns
      );
      if (projectedBatch.length <= remaining) {
        remaining -= projectedBatch.length;
        rowsReturned += projectedBatch.length;
        yield projectedBatch;
      } else {
        const outputBatch = truncateTableBatch(projectedBatch, remaining);
        rowsReturned += outputBatch.length;
        earlyTerminationReason = 'limit';
        yield outputBatch;
        return;
      }
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
    emitScanExecutionTelemetry(
      options.onTelemetry,
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
  if (batch.shape === 'object-row-table' || batch.shape === 'array-row-table') {
    return {...batch, data: batch.data.slice(0, length), length} as TableBatch;
  }
  if (batch.shape === 'columnar-table') {
    return {
      ...batch,
      data: Object.fromEntries(
        Object.entries(batch.data).map(([name, values]) => [
          name,
          Array.from(values as ArrayLike<unknown>).slice(0, length)
        ])
      ),
      length
    };
  }
  if (batch.shape === 'arrow-table') return {...batch, data: batch.data.slice(0, length), length};
  return {...batch, features: batch.features.slice(0, length), length};
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
