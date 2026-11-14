// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  dehydrateArrowTable,
  hydrateArrowTable,
  type DehydratedArrowTable,
  type SplitArrowBuffersOptions
} from '@math.gl/arrow';
/** Per-batch metadata transferred alongside math.gl's column payload. */
type BatchMetadata = {
  schema: Uint8Array;
  metadata: [string, string][];
};

type ArrowWorkerOptions = {
  core?: {workerTransferBufferCopy?: SplitArrowBuffersOptions['copy']};
  workerTransferBufferCopy?: SplitArrowBuffersOptions['copy'];
};
/** Transferable columns and metadata for a native Arrow value. */
type ArrowWorkerColumns = {
  data: DehydratedArrowTable;
  arrowBatchMetadata?: BatchMetadata[];
};

/** Wire payload for callers that still carry format-specific side metadata. */
type ArrowWorkerEnvelope = ArrowWorkerColumns & {
  transport: 'arrow-column-envelope';
  metadata: Record<string, unknown>;
};

/** Previous envelope accepted during hydration for workers built against older releases. */
type LegacyArrowWorkerEnvelope = ArrowWorkerColumns & {
  shape: 'arrow-table';
  [key: string]: unknown;
};

/** Serializes Arrow columns with owned buffers so transfers cannot detach retained parser state. */
export function serializeArrowWorkerTable(result: unknown): unknown {
  if (!isArrowTableWrapper(result)) {
    throw new Error('Workers require Arrow table output');
  }
  const {data, shape: _shape, ...metadata} = result;
  // Headers, sidecar indexes, and mesh indices can also retain parser-owned binary buffers.
  // Clone only this small envelope; the Arrow table always uses column-buffer transfer.
  return {
    transport: 'arrow-column-envelope',
    metadata: structuredClone(metadata),
    ...serializeWorkerColumns(data, {copy: 'all'})
  } satisfies ArrowWorkerEnvelope;
}

/** Hydrates the column-buffer worker protocol; other wire formats are rejected. */
export function deserializeArrowWorkerTable(result: unknown): any {
  if (isArrowWorkerEnvelope(result)) {
    return {...result.metadata, shape: 'arrow-table', data: hydrateWorkerTable(result)};
  }
  if (isLegacyArrowWorkerEnvelope(result)) {
    const {arrowBatchMetadata: _snapshots, data: _columns, ...metadata} = result;
    return {...metadata, data: hydrateWorkerTable(result)};
  }
  throw new Error('Workers require Arrow column transport');
}

/** Serializes a native Arrow table or batch with owned column buffers for worker transport. */
export function serializeNativeArrowWorkerResult(
  result: arrow.Table | arrow.RecordBatch,
  options: SplitArrowBuffersOptions = {copy: 'all'}
): unknown {
  const batch = result instanceof arrow.RecordBatch;
  if (!batch && !(result instanceof arrow.Table)) {
    throw new Error('Workers require Arrow table output');
  }
  const table = batch ? new arrow.Table(result.schema, [result]) : result;
  return {
    transport: batch ? 'arrow-record-batch' : 'arrow-table-columns',
    columns: serializeWorkerColumns(table, options)
  };
}

/** Hydrates a native Arrow worker result while preserving its table or batch type. */
export function deserializeNativeArrowWorkerResult(
  result: unknown
): arrow.Table | arrow.RecordBatch {
  const payload = result as {transport: string; columns: unknown};
  if (
    (payload?.transport !== 'arrow-table-columns' && payload?.transport !== 'arrow-record-batch') ||
    !hasArrowWorkerColumns(payload.columns)
  ) {
    throw new Error('Workers require Arrow column transport');
  }
  const data = hydrateWorkerTable(payload.columns);
  return payload.transport === 'arrow-record-batch' ? data.batches[0] : data;
}

/** Serializes any loaders.gl Arrow table wrapper for worker postMessage transport. */
export function serializeArrowWorkerResult(result: unknown, options?: unknown): unknown {
  const workerOptions = options as ArrowWorkerOptions | undefined;
  const bufferCopyMode =
    workerOptions?.core?.workerTransferBufferCopy ?? workerOptions?.workerTransferBufferCopy;
  if (result instanceof arrow.Table || result instanceof arrow.RecordBatch) {
    return serializeNativeArrowWorkerResult(result, {copy: bufferCopyMode ?? 'all'});
  }
  if (!isArrowTableWrapper(result)) {
    return result;
  }
  const {data, shape: _shape, ...metadata} = result;
  return {
    transport: 'arrow-column-envelope',
    metadata: structuredClone(metadata),
    ...serializeWorkerColumns(data, bufferCopyMode ? {copy: bufferCopyMode} : undefined)
  } satisfies ArrowWorkerEnvelope;
}

/** Rehydrates any loaders.gl Arrow table wrapper returned from worker postMessage transport. */
export function deserializeArrowWorkerResult(result: unknown): any {
  const transport = (result as {transport?: string} | null)?.transport;
  if (transport === 'arrow-table-columns' || transport === 'arrow-record-batch') {
    return deserializeNativeArrowWorkerResult(result);
  }
  return isArrowWorkerEnvelope(result) || isLegacyArrowWorkerEnvelope(result)
    ? deserializeArrowWorkerTable(result)
    : result;
}

function isArrowTableWrapper(
  value: unknown
): value is {shape: 'arrow-table'; data: arrow.Table; [key: string]: unknown} {
  const table = value as {shape?: unknown; data?: unknown} | null;
  return Boolean(
    table &&
      table.shape === 'arrow-table' &&
      table.data &&
      typeof table.data === 'object' &&
      'batches' in table.data
  );
}

/** Recognizes a transferable Arrow columns descriptor. */
function hasArrowWorkerColumns(value: unknown): value is ArrowWorkerColumns {
  const columns = value as ArrowWorkerColumns | null;
  return columns?.data?.transport === 'arrow-js' && Array.isArray(columns.data.batches);
}

/** Recognizes payloads carrying format-specific metadata. */
function isArrowWorkerEnvelope(value: unknown): value is ArrowWorkerEnvelope {
  return (
    (value as ArrowWorkerEnvelope | null)?.transport === 'arrow-column-envelope' &&
    hasArrowWorkerColumns(value)
  );
}

/** Recognizes wrapped column payloads from older workers. */
function isLegacyArrowWorkerEnvelope(value: unknown): value is LegacyArrowWorkerEnvelope {
  return (
    (value as LegacyArrowWorkerEnvelope | null)?.shape === 'arrow-table' &&
    hasArrowWorkerColumns(value)
  );
}

/** Serializes columns and independent batch metadata. */
function serializeWorkerColumns(
  table: arrow.Table,
  options?: SplitArrowBuffersOptions
): ArrowWorkerColumns {
  return {
    arrowBatchMetadata: snapshotBatchMetadata(table),
    data: dehydrateWorkerTable(table, options)
  };
}

/** Preserves row counts for tables whose batches have no columns. */
function dehydrateWorkerTable(
  table: arrow.Table,
  options?: SplitArrowBuffersOptions
): DehydratedArrowTable {
  const payload = dehydrateArrowTable(table, options);
  if (table.numCols === 0) {
    for (const [index, batch] of table.batches.entries()) {
      payload.batches[index].length = batch.numRows;
    }
  }
  return payload;
}

/** Captures batch schemas and custom metadata before transferring column buffers. */
function snapshotBatchMetadata(table: arrow.Table): BatchMetadata[] {
  return table.batches.map(batch => ({
    schema: arrow.tableToIPC(new arrow.Table(batch.schema, [])),
    metadata: Array.from(batch.metadata)
  }));
}

/** Restores the table and its batch snapshots, including legacy payloads without snapshots. */
function hydrateWorkerTable(result: ArrowWorkerColumns): arrow.Table {
  const {arrowBatchMetadata, data} = result;
  const table = hydrateArrowTable(data);
  const batches = table.batches.map((batch, index) => {
    const snapshot = arrowBatchMetadata?.[index];
    const restored = snapshot
      ? new arrow.RecordBatch(
          arrow.tableFromIPC(snapshot.schema).schema,
          batch.data,
          new Map(snapshot.metadata)
        )
      : batch;
    // Arrow JS derives the length of a struct from its children, which can be empty.
    const rowCount = data.batches[index].length;
    if (restored.numCols === 0 && restored.numRows !== rowCount) {
      Object.defineProperty(restored, 'data', {
        value: new arrow.Data(new arrow.Struct([]), 0, rowCount, 0, undefined, [])
      });
    }
    return restored;
  });
  return new arrow.Table(table.schema, batches);
}
