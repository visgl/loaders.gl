// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ParquetBatch} from '../parquet-source-types';

/**
 * Retains a window of rows of a Parquet batch while keeping source-position provenance aligned.
 *
 * This is used by physical readers, dataset orchestration, and table-format delete handling to
 * implement one global post-filter limit without materializing row objects.
 */
export function sliceParquetBatch<BatchT extends ParquetBatch>(
  batch: BatchT,
  rowCount: number,
  start = 0
): BatchT {
  if (
    !Number.isSafeInteger(rowCount) ||
    rowCount < 0 ||
    !Number.isSafeInteger(start) ||
    start < 0 ||
    rowCount + start > batch.length
  ) {
    throw new Error(`Parquet batch row count must be between zero and ${batch.length}`);
  }
  if (rowCount === batch.length) return batch;
  const rowGroupRowIndices = batch.rowGroupRowIndices?.slice(start, start + rowCount);
  const rowIndices = batch.rowIndices?.slice(start, start + rowCount);
  const rowGroupRowOffset = rowGroupRowIndices?.[0] ?? batch.rowGroupRowOffset + start;
  const rowOffset = rowIndices?.[0] ?? batch.rowOffset + start;
  return {
    ...batch,
    data: batch.data.slice(start, start + rowCount),
    rowGroupRowOffset,
    rowOffset,
    length: rowCount,
    rowCount,
    rowGroupRowIndices,
    rowIndices,
    metadata: batch.metadata
      ? {...batch.metadata, rowCount, rowGroupRowOffset, rowOffset, rowGroupRowIndices, rowIndices}
      : batch.metadata
  } as BatchT;
}
