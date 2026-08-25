// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ParquetBatch} from '../parquet-source-types';

/**
 * Retains the leading rows of a Parquet batch while keeping source-position provenance aligned.
 *
 * This is used by physical readers, dataset orchestration, and table-format delete handling to
 * implement one global post-filter limit without materializing row objects.
 */
export function sliceParquetBatch<BatchT extends ParquetBatch>(
  batch: BatchT,
  rowCount: number
): BatchT {
  if (!Number.isSafeInteger(rowCount) || rowCount < 0 || rowCount > batch.length) {
    throw new Error(`Parquet batch row count must be between zero and ${batch.length}`);
  }
  if (rowCount === batch.length) return batch;
  const rowGroupRowIndices = batch.rowGroupRowIndices?.slice(0, rowCount);
  const rowIndices = batch.rowIndices?.slice(0, rowCount);
  return {
    ...batch,
    data: batch.data.slice(0, rowCount),
    length: rowCount,
    rowCount,
    rowGroupRowIndices,
    rowIndices,
    metadata: batch.metadata ? {...batch.metadata, rowCount} : batch.metadata
  } as BatchT;
}
