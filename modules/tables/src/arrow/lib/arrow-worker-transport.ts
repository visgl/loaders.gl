// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table as NativeArrowTable, RecordBatch} from 'apache-arrow';
import type {Table} from '@loaders.gl/core/schema';
import {convertArrowToTable} from '@loaders.gl/core/schema-utils';
import {
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

/** Hydrates an Arrow table transferred by the IPC worker. */
export function deserializeIPCWorkerTable(result: unknown): NativeArrowTable {
  const table = deserializeNativeArrowWorkerResult(result);
  if (!(table instanceof NativeArrowTable)) throw new Error('IPC workers require an Arrow table');
  return table;
}

/** Hydrates an Arrow record batch transferred by the IPC worker. */
export function deserializeIPCWorkerBatch(result: unknown): RecordBatch {
  const batch = deserializeNativeArrowWorkerResult(result);
  if (!(batch instanceof RecordBatch)) throw new Error('IPC workers require an Arrow record batch');
  return batch;
}
