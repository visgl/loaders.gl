// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, RecordBatch} from 'apache-arrow';
import {
  serializeNativeArrowWorkerResult,
  deserializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/core/schema';
import type {ParquetLoaderOptions} from '../parquet-loader-options';
import {convertArrowTable, convertArrowTableBatch} from '@loaders.gl/core/schema-utils';

/** Transfers owned Arrow column buffers for an atomic Parquet result. */
export function serializeParquetWorkerResult(table: unknown): unknown {
  if (!(table instanceof Table)) throw new Error('Workers require Arrow table output');
  return serializeNativeArrowWorkerResult(table);
}

/** Hydrates columns before optional caller-side row conversion. */
export function deserializeParquetWorkerResult(
  result: unknown,
  options?: ParquetLoaderOptions
): Table | ObjectRowTable {
  const table = deserializeNativeArrowWorkerResult(result) as Table;
  return options?.parquet?.shape === 'object-row-table'
    ? convertArrowTable({shape: 'arrow-table', data: table}, 'object-row-table')
    : table;
}

/** Carries the requested row shape alongside native worker batches. */
export function serializeParquetWorkerBatch(
  batch: unknown,
  options?: ParquetLoaderOptions
): unknown {
  if (!(batch instanceof RecordBatch)) throw new Error('Workers require Arrow record batch output');
  return {
    payload: serializeNativeArrowWorkerResult(batch),
    resultShape: options?.parquet?.shape
  };
}

/** Hydrates a native batch and materializes rows only when requested. */
export function deserializeParquetWorkerBatch(result: unknown): RecordBatch | ObjectRowTableBatch {
  const {payload, resultShape} = result as {payload: unknown; resultShape?: string};
  const batch = deserializeNativeArrowWorkerResult(payload) as RecordBatch;
  return resultShape === 'object-row-table' ? convertParquetBatchToRows(batch) : batch;
}

/** Converts one native batch to the object-row output contract. */
export function convertParquetBatchToRows(batch: RecordBatch): ObjectRowTableBatch {
  return convertArrowTableBatch(
    {
      shape: 'arrow-table',
      batchType: 'data',
      length: batch.numRows,
      data: new Table(batch.schema, [batch])
    },
    'object-row-table'
  );
}
