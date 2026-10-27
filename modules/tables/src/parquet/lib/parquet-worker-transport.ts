// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  serializeArrowWorkerTable,
  deserializeArrowWorkerTable
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

/** Transfers owned Arrow column buffers for an atomic Parquet result. */
export const serializeParquetWorkerResult = serializeArrowWorkerTable;

/** Hydrates columns before optional caller-side row conversion. */
export function deserializeParquetWorkerResult(
  result: unknown,
  options?: ParquetLoaderOptions
): ArrowTable | ObjectRowTable {
  const table = deserializeArrowWorkerTable(result);
  return options?.parquet?.shape === 'object-row-table'
    ? convertArrowTableToObjectRows(table)
    : table;
}

/** Keeps the requested public shape separate from the columnar wire shape. */
export function serializeParquetWorkerBatch(
  batch: unknown,
  options?: ParquetLoaderOptions
): unknown {
  const serialized = serializeArrowWorkerTable(batch) as object;
  return {...serialized, resultShape: options?.parquet?.shape || 'arrow-table'};
}

/** Converts requested rows only after the column buffers reach the caller. */
export function deserializeParquetWorkerBatch(
  batch: unknown
): ArrowTableBatch | ObjectRowTableBatch {
  const table = deserializeArrowWorkerTable(batch);
  return table.resultShape === 'object-row-table'
    ? {...table, ...convertArrowBatchToObjectRows(table)}
    : table;
}
