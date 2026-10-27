// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTableBatch, Table} from '@loaders.gl/core/schema';
import {convertArrowToTable} from '@loaders.gl/core/schema-utils';
import {
  serializeArrowWorkerTable,
  deserializeArrowWorkerTable
} from '@loaders.gl/core/schema-utils/arrow-transport';
import type {ArrowLoaderOptions} from '../exports/arrow-loader';

/** Owns all Arrow column buffers, including dictionaries retained by successive parser batches. */
export const serializeArrowTableResult = serializeArrowWorkerTable;

/** Hydrates columns before materializing the requested output shape on the caller. */
export function deserializeArrowTableResult(result: unknown, options?: ArrowLoaderOptions): Table {
  const table = deserializeArrowTableBatch(result);
  return convertArrowToTable(table.data, options?.arrow?.shape || 'columnar-table');
}

/** Hydrates column buffers while preserving batch metadata. */
export function deserializeArrowTableBatch(result: unknown): ArrowTableBatch {
  return deserializeArrowWorkerTable(result) as ArrowTableBatch;
}
