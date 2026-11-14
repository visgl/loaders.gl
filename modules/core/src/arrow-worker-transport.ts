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
type SerializedArrowWorkerTable = {
  shape: 'arrow-table';
  data: DehydratedArrowTable;
  arrowBatchMetadata?: BatchMetadata[];
  [key: string]: unknown;
};

/** Serializes Arrow columns with owned buffers so transfers cannot detach retained parser state. */
export function serializeArrowWorkerTable(result: unknown): unknown {
  if (!isArrowTableWrapper(result)) {
    throw new Error('Workers require Arrow table output');
  }
  const {data, ...metadata} = result;
  // Headers, sidecar indexes, and mesh indices can also retain parser-owned binary buffers.
  // Clone only this small envelope; the Arrow table always uses column-buffer transfer.
  return {
    ...structuredClone(metadata),
    arrowBatchMetadata: snapshotBatchMetadata(data),
    data: dehydrateArrowTable(data, {copy: 'all'})
  };
}

/** Hydrates the column-buffer worker protocol; other wire formats are rejected. */
export function deserializeArrowWorkerTable(result: unknown): any {
  if (!isDehydratedArrowTableWrapper(result)) {
    throw new Error('Workers require Arrow column transport');
  }
  return hydrateWorkerTable(result);
}

/** Serializes a native Arrow table or batch with owned column buffers for worker transport. */
export function serializeNativeArrowWorkerResult(result: arrow.Table | arrow.RecordBatch): unknown {
  const batch = result instanceof arrow.RecordBatch;
  return {
    transport: batch ? 'arrow-record-batch' : 'arrow-table-columns',
    columns: serializeArrowWorkerTable({
      shape: 'arrow-table',
      data: batch ? new arrow.Table(result.schema, [result]) : result
    })
  };
}

/** Hydrates a native Arrow worker result while preserving its table or batch type. */
export function deserializeNativeArrowWorkerResult(
  result: unknown
): arrow.Table | arrow.RecordBatch {
  const payload = result as {transport: string; columns: unknown};
  const {data}: {data: arrow.Table} = deserializeArrowWorkerTable(payload.columns);
  return payload.transport === 'arrow-record-batch' ? data.batches[0] : data;
}

/** Serializes any loaders.gl Arrow table wrapper for worker postMessage transport. */
export function serializeArrowWorkerResult(result: unknown, options?: unknown): unknown {
  if (!isArrowTableWrapper(result)) {
    return result;
  }
  const workerOptions = options as ArrowWorkerOptions | undefined;
  const bufferCopyMode =
    workerOptions?.core?.workerTransferBufferCopy ?? workerOptions?.workerTransferBufferCopy;
  return {
    ...result,
    arrowBatchMetadata: snapshotBatchMetadata(result.data),
    data: dehydrateArrowTable(result.data, bufferCopyMode ? {copy: bufferCopyMode} : undefined)
  };
}

/** Rehydrates any loaders.gl Arrow table wrapper returned from worker postMessage transport. */
export function deserializeArrowWorkerResult(result: unknown): any {
  if (!isDehydratedArrowTableWrapper(result)) {
    return result;
  }
  return hydrateWorkerTable(result);
}

function isArrowTableWrapper(value: unknown): value is {shape: 'arrow-table'; data: arrow.Table} {
  const table = value as {shape?: unknown; data?: unknown} | null;
  return Boolean(
    table &&
      table.shape === 'arrow-table' &&
      table.data &&
      typeof table.data === 'object' &&
      'batches' in table.data
  );
}

function isDehydratedArrowTableWrapper(value: unknown): value is SerializedArrowWorkerTable {
  const table = value as SerializedArrowWorkerTable | null;
  return Boolean(
    table &&
      table.shape === 'arrow-table' &&
      table.data &&
      table.data.transport === 'arrow-js' &&
      Array.isArray(table.data.batches)
  );
}

/** Captures batch schemas and custom metadata before transferring column buffers. */
function snapshotBatchMetadata(table: arrow.Table): BatchMetadata[] {
  return table.batches.map(batch => ({
    schema: arrow.tableToIPC(new arrow.Table(batch.schema, [])),
    metadata: Array.from(batch.metadata)
  }));
}

/** Restores the table and its batch snapshots, including legacy payloads without snapshots. */
function hydrateWorkerTable(result: SerializedArrowWorkerTable): unknown {
  const {arrowBatchMetadata, data, ...envelope} = result;
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
  return {...envelope, data: new arrow.Table(table.schema, batches)};
}
