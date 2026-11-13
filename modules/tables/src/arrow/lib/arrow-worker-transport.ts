// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as NativeArrowTable} from 'apache-arrow';
import type {ArrowTableBatch, Table} from '@loaders.gl/core/schema';
import {convertArrowTable} from '@loaders.gl/core/schema-utils';
import {
  serializeArrowWorkerTable,
  deserializeArrowWorkerTable
} from '@loaders.gl/core/arrow-worker-transport';
import type {ArrowLoaderOptions} from '../exports/arrow-loader';

/** Owns all Arrow column buffers, including dictionaries retained by successive parser batches. */
export const serializeArrowTableResult = serializeArrowWorkerTable;

/** Hydrates columns before materializing the requested output shape on the caller. */
export function deserializeArrowTableResult(
  result: unknown,
  options?: ArrowLoaderOptions | {arrow: {shape: 'arrow-table'}}
): Table | NativeArrowTable {
  const table = deserializeArrowTableBatch(result);
  const shape = options?.arrow?.shape;
  return shape === 'arrow' ? table.data : convertArrowTable(table, shape || 'columnar-table');
}

/** Hydrates column buffers while preserving batch metadata. */
export function deserializeArrowTableBatch(result: unknown): ArrowTableBatch {
  return deserializeArrowWorkerTable(result) as ArrowTableBatch;
}
