// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ParquetDecodedBatch} from '../parquet-source-types';

/**
 * Retains a window of rows of a Parquet batch while keeping source-position provenance aligned.
 *
 * This is used by physical readers, dataset orchestration, and table-format delete handling to
 * implement one global post-filter limit without materializing row objects.
 */
export function sliceParquetBatch<BatchT extends ParquetDecodedBatch>(
  batch: BatchT,
  rowCount: number,
  start = 0
): BatchT {
  if (
    !Number.isSafeInteger(rowCount) ||
    rowCount < 0 ||
    !Number.isSafeInteger(start) ||
    start < 0 ||
    rowCount + start > batch.rowCount
  ) {
    throw new Error(`Parquet batch row count must be between zero and ${batch.rowCount}`);
  }
  if (rowCount === batch.rowCount) return batch;
  const rowGroupRowIndices = batch.rowGroupRowIndices?.slice(start, start + rowCount);
  const rowIndices = batch.rowIndices?.slice(start, start + rowCount);
  const rowGroupRowOffset = rowGroupRowIndices?.[0] ?? batch.rowGroupRowOffset + start;
  const rowOffset = rowIndices?.[0] ?? batch.rowOffset + start;
  return {
    ...batch,
    data: batch.data.slice(start, start + rowCount),
    rowGroupRowOffset,
    rowOffset,
    rowCount,
    rowGroupRowIndices,
    rowIndices,
    metadata: {
      ...batch.metadata,
      rowCount,
      rowGroupRowOffset,
      rowOffset,
      rowGroupRowIndices,
      rowIndices
    }
  } as BatchT;
}
