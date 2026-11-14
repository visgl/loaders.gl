// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table as NativeArrowTable, RecordBatch} from 'apache-arrow';
import type {Table} from '@loaders.gl/core/schema';
import {convertArrowToTable, makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {
  deserializeArrowWorkerTable,
  serializeNativeArrowWorkerResult,
  deserializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import type {ArrowLoaderOptions} from '../arrow-loader-types';

/** Owns all Arrow column buffers, including dictionaries retained by successive parser batches. */
export function serializeArrowTableResult(result: unknown): unknown {
  if (!(result instanceof NativeArrowTable || result instanceof RecordBatch)) {
    throw new Error('Workers require Arrow table output');
  }
  return serializeNativeArrowWorkerResult(result);
}

/** Hydrates columns before materializing the requested output shape on the caller. */
export function deserializeArrowTableResult(
  result: unknown,
  options?: ArrowLoaderOptions
): Table | NativeArrowTable {
  const table = deserializeIPCWorkerTable(result);
  const shape = options?.arrow?.shape ?? 'columnar-table';
  if (shape === 'arrow') return table;
  return convertArrowToTable(table, shape);
}

/** Hydrates native IPC tables and accepts the older column wrapper. */
export function deserializeIPCWorkerTable(result: unknown): NativeArrowTable {
  if ((result as {transport?: string})?.transport === 'arrow-table-columns') {
    return deserializeNativeArrowWorkerResult(result) as NativeArrowTable;
  }
  return deserializeArrowWorkerTable(result).data;
}

/** Hydrates native IPC batches and accepts the older column wrapper. */
export function deserializeIPCWorkerBatch(result: unknown): RecordBatch {
  if ((result as {transport?: string})?.transport === 'arrow-record-batch') {
    return deserializeNativeArrowWorkerResult(result) as RecordBatch;
  }
  const table = deserializeArrowWorkerTable(result).data as NativeArrowTable;
  return table.batches[0] ?? makeArrowMetadataBatch(table.schema);
}
