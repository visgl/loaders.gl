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
    return snapshot
      ? new arrow.RecordBatch(
          arrow.tableFromIPC(snapshot.schema).schema,
          batch.data,
          new Map(snapshot.metadata)
        )
      : batch;
  });
  return {...envelope, data: new arrow.Table(table.schema, batches)};
}
