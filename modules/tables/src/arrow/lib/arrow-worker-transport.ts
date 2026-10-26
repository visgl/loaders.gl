// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, Table} from '@loaders.gl/core/schema';
import {convertArrowToTable} from '@loaders.gl/core/schema-utils';
import {
  serializeArrowTableToIPC,
  deserializeArrowTableFromIPC,
  type SerializedArrowTableIPC
} from '@loaders.gl/core/schema-utils/arrow-transport';
import type {ArrowLoaderOptions} from '../exports/arrow-loader';

/** Arrow IPC owns its buffers, including dictionaries shared by successive parser batches. */
type ArrowWorkerResult = Omit<ArrowTable, 'data'> & {
  /** Independently transferable IPC bytes. */
  data: SerializedArrowTableIPC;
};

/** Serializes only Arrow data; accidental row payloads fail before worker dispatch. */
export function serializeArrowIPCResult(result: unknown): ArrowWorkerResult {
  const table = result as ArrowTable;
  if (table?.shape !== 'arrow-table' || !table.data?.batches) {
    throw new Error('Arrow workers require Arrow table output');
  }
  return {...table, data: serializeArrowTableToIPC(table.data)};
}

/** Hydrates columnar output before materializing the requested shape on the caller. */
export function deserializeArrowIPCResult(result: unknown, options?: ArrowLoaderOptions): Table {
  const table = deserializeArrowIPCBatch(result);
  return convertArrowToTable(table.data, options?.arrow?.shape || 'columnar-table');
}

/** Preserves the existing Arrow batch API and all batch metadata. */
export function deserializeArrowIPCBatch(result: unknown): ArrowTableBatch {
  const table = result as ArrowWorkerResult;
  return {...table, data: deserializeArrowTableFromIPC(table.data)} as ArrowTableBatch;
}
