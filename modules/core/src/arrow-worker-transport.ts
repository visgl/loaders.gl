// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  createRecordBatchWithMetadata,
  getRecordBatchMetadata,
  dehydrateArrowTable,
  dehydrateArrowRecordBatch,
  hydrateArrowTable,
  hydrateArrowRecordBatch,
  type DehydratedArrowTable,
  type SplitArrowBuffersOptions
} from '@math.gl/arrow';
/** Per-batch metadata transferred alongside math.gl's column payload. */
type BatchMetadata = {
  schema: Uint8Array;
  metadata?: [string, string][];
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

/** Serializes a native Arrow table or batch with owned column buffers for worker transport. */
export function serializeNativeArrowWorkerResult(
  result: arrow.Table | arrow.RecordBatch,
  options: SplitArrowBuffersOptions = {copy: 'all'}
): unknown {
  const batch = result instanceof arrow.RecordBatch;
  if (!batch && !(result instanceof arrow.Table)) {
    throw new Error('Workers require Arrow table output');
  }
  return {
    transport: batch ? 'arrow-record-batch' : 'arrow-table-columns',
    columns: batch
      ? {data: dehydrateArrowRecordBatch(result, options)}
      : serializeWorkerColumns(result, options)
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
  if (payload.transport === 'arrow-record-batch' && !payload.columns.arrowBatchMetadata) {
    return hydrateArrowRecordBatch(payload.columns.data);
  }
  const data = hydrateWorkerTable(payload.columns);
  return payload.transport === 'arrow-record-batch' ? data.batches[0] : data;
}

/** Transfers native Arrow columns and passes other loader results through. */
export function serializeArrowWorkerResult(result: unknown, options?: unknown): unknown {
  const workerOptions = options as ArrowWorkerOptions | undefined;
  const copy =
    workerOptions?.core?.workerTransferBufferCopy ?? workerOptions?.workerTransferBufferCopy;
  return result instanceof arrow.Table || result instanceof arrow.RecordBatch
    ? serializeNativeArrowWorkerResult(result, {copy: copy ?? 'all'})
    : result;
}

/** Restores native Arrow worker results and passes other loader results through. */
export function deserializeArrowWorkerResult<ResultType = unknown>(result: unknown): ResultType {
  const transport = (result as {transport?: string} | null)?.transport;
  return (
    transport === 'arrow-table-columns' || transport === 'arrow-record-batch'
      ? deserializeNativeArrowWorkerResult(result)
      : result
  ) as ResultType;
}

/** Recognizes a transferable Arrow columns descriptor. */
function hasArrowWorkerColumns(value: unknown): value is ArrowWorkerColumns {
  const columns = value as ArrowWorkerColumns | null;
  return columns?.data?.transport === 'arrow-js' && Array.isArray(columns.data.batches);
}

/** Serializes columns and independent batch metadata. */
function serializeWorkerColumns(
  table: arrow.Table,
  options?: SplitArrowBuffersOptions
): ArrowWorkerColumns {
  return {
    arrowBatchMetadata: snapshotBatchMetadata(table),
    data: dehydrateArrowTable(table, options)
  };
}

/** Captures batch schemas before transferring column buffers. */
function snapshotBatchMetadata(table: arrow.Table): BatchMetadata[] {
  return table.batches.map(batch => ({
    schema: arrow.tableToIPC(new arrow.Table(batch.schema, []))
  }));
}

/** Restores the table and its batch snapshots, including legacy payloads without snapshots. */
function hydrateWorkerTable(result: ArrowWorkerColumns): arrow.Table {
  const {arrowBatchMetadata, data} = result;
  const table = hydrateArrowTable(data);
  const batches = table.batches.map((batch, index) => {
    const snapshot = arrowBatchMetadata?.[index];
    return snapshot
      ? createRecordBatchWithMetadata(
          arrow.tableFromIPC(snapshot.schema).schema,
          batch.data,
          snapshot.metadata ? new Map(snapshot.metadata) : getRecordBatchMetadata(batch)
        )
      : batch;
  });
  return new arrow.Table(table.schema, batches);
}
