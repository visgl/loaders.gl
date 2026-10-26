// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SerializedArrowTableIPC} from '@loaders.gl/core/schema-utils/arrow-transport';
import {
  deserializeArrowTableFromIPC,
  serializeArrowTableToIPC
} from '@loaders.gl/core/schema-utils/arrow-transport';
import type {
  ArrowTable,
  ObjectRowTable,
  ArrowTableBatch,
  ObjectRowTableBatch
} from '@loaders.gl/core/schema';

import type {ParquetLoaderOptions} from '../parquet-loader-options';
import {
  convertArrowBatchToObjectRows,
  convertArrowTableToObjectRows
} from './parsers/convert-parquet-tables';

type ParquetWorkerResult = ArrowTable | ObjectRowTable;

type SerializedArrowTable = Omit<ArrowTable, 'data'> & {
  /** Transferable Arrow IPC payload produced by the worker. */
  data: SerializedArrowTableIPC;
};

/** Wire representation shared by both public Parquet batch shapes. */
type SerializedParquetBatch = Pick<ArrowTableBatch, 'batchType' | 'length' | 'schema'> & {
  /** Output shape requested by the caller. */
  shape: 'arrow-table' | 'object-row-table';
  /** Independently owned decoded Arrow IPC bytes. */
  data: SerializedArrowTableIPC;
};

/** Serializes a Parquet worker result so Arrow buffers are transferred without cloning. */
export function serializeParquetWorkerResult(result: unknown): unknown {
  if (!isArrowTable(result)) {
    throw new Error('Parquet workers require Arrow table output');
  }
  return {
    ...result,
    data: serializeArrowTableToIPC(result.data)
  };
}

/** Rehydrates a transferred Parquet Arrow result into main-thread Arrow class instances. */
export function deserializeParquetWorkerResult(
  result: unknown,
  options?: ParquetLoaderOptions
): ParquetWorkerResult {
  if (isSerializedArrowTable(result)) {
    const table = {...result, data: deserializeArrowTableFromIPC(result.data)};
    return options?.parquet?.shape === 'object-row-table'
      ? convertArrowTableToObjectRows(table)
      : table;
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

/**
 * Transports decoded Arrow batches with owned IPC bytes and the caller's requested output shape.
 * The worker retains columnar batches so nested Arrow values never enter structured clone.
 */
export function serializeParquetWorkerBatch(
  batch: unknown,
  options?: ParquetLoaderOptions
): unknown {
  const serialized = serializeParquetWorkerResult(batch) as SerializedParquetBatch;
  return {...serialized, shape: options?.parquet?.shape || serialized.shape};
}

/** Rehydrates IPC batches and materializes object rows on the caller when requested. */
export function deserializeParquetWorkerBatch(
  batch: unknown
): ArrowTableBatch | ObjectRowTableBatch {
  const serialized = batch as SerializedParquetBatch;
  if (serialized.shape === 'object-row-table' && serialized.data?.transport === 'arrow-ipc') {
    return {
      ...serialized,
      ...convertArrowBatchToObjectRows({
        ...serialized,
        shape: 'arrow-table',
        data: deserializeArrowTableFromIPC(serialized.data)
      })
    };
  }
  return deserializeParquetWorkerResult(batch) as ArrowTableBatch | ObjectRowTableBatch;
}
