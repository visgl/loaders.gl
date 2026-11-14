// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RecordBatch} from 'apache-arrow';
import type {ParquetBatch} from '../parquet-source-types';

/** Exposes decoded batches with file and row provenance in Arrow metadata. */
export async function* streamNativeParquetBatches(
  batches: AsyncIterable<ParquetBatch> | Iterable<ParquetBatch>
): AsyncIterable<RecordBatch> {
  for await (const batch of batches) {
    let start = 0;
    for (const recordBatch of batch.data.batches) {
      const length = recordBatch.numRows;
      const rowIndices = batch.rowIndices?.slice(start, start + length);
      const rowGroupRowIndices = batch.rowGroupRowIndices?.slice(start, start + length);
      const metadata = new Map(recordBatch.metadata);
      metadata.set(
        'loaders.gl.parquetProvenance',
        JSON.stringify({
          ...batch.metadata,
          rowCount: length,
          rowOffset: rowIndices?.[0] ?? batch.rowOffset + start,
          rowGroupRowOffset: rowGroupRowIndices?.[0] ?? batch.rowGroupRowOffset + start,
          rowIndices,
          rowGroupRowIndices
        })
      );
      yield new RecordBatch(recordBatch.schema, recordBatch.data, metadata);
      start += length;
    }
  }
}
