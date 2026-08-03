// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SerializedArrowTableIPC} from '@loaders.gl/arrow';
import {deserializeArrowTableFromIPC, serializeArrowTableToIPC} from '@loaders.gl/arrow';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';

type ParquetWorkerResult = ArrowTable | ObjectRowTable;

type SerializedArrowTable = Omit<ArrowTable, 'data'> & {
  /** Transferable Arrow IPC payload produced by the worker. */
  data: SerializedArrowTableIPC;
};

/** Serializes a Parquet worker result so Arrow buffers are transferred without cloning. */
export function serializeParquetWorkerResult(result: unknown): unknown {
  if (!isArrowTable(result)) {
    return result;
  }
  return {
    ...result,
    data: serializeArrowTableToIPC(result.data)
  };
}

/** Rehydrates a transferred Parquet Arrow result into main-thread Arrow class instances. */
export function deserializeParquetWorkerResult(result: unknown): ParquetWorkerResult {
  if (isSerializedArrowTable(result)) {
    return {...result, data: deserializeArrowTableFromIPC(result.data)};
  }
  return result as ParquetWorkerResult;
}

/** Returns true when a parser result wraps an Apache Arrow table. */
function isArrowTable(value: unknown): value is ArrowTable {
  const table = value as ArrowTable;
  return Boolean(
    table &&
      typeof table === 'object' &&
      table.shape === 'arrow-table' &&
      table.data &&
      'batches' in table.data
  );
}

/** Returns true when a worker result contains the loaders.gl Arrow IPC transport format. */
function isSerializedArrowTable(value: unknown): value is SerializedArrowTable {
  const table = value as SerializedArrowTable;
  return Boolean(
    table &&
      typeof table === 'object' &&
      table.shape === 'arrow-table' &&
      table.data &&
      table.data.transport === 'arrow-ipc'
  );
}
