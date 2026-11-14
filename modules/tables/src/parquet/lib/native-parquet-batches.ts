// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RecordBatch} from 'apache-arrow';
import type {
  ParquetBatch,
  ParquetBatchProvenance,
  ParquetDatasetBatchProvenance
} from '../parquet-source-types';

const PARQUET_PROVENANCE_KEY = 'loaders.gl.parquetProvenance';

/** Decodes file and row provenance, including typed Iceberg catalog values. */
export function getParquetBatchProvenance(
  batch: RecordBatch
): (ParquetBatchProvenance & Partial<ParquetDatasetBatchProvenance>) | undefined {
  const encoded = batch.metadata.get(PARQUET_PROVENANCE_KEY);
  return encoded === undefined
    ? undefined
    : JSON.parse(encoded, (_key, value) => {
        if (value?.['loaders.gl.bigint'] !== undefined) return BigInt(value['loaders.gl.bigint']);
        if (value?.['loaders.gl.bytes'] !== undefined)
          return Uint8Array.from(value['loaders.gl.bytes']);
        return value;
      });
}

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
        PARQUET_PROVENANCE_KEY,
        JSON.stringify(
          {
            ...batch.metadata,
            rowCount: length,
            rowOffset: rowIndices?.[0] ?? batch.rowOffset + start,
            rowGroupRowOffset: rowGroupRowIndices?.[0] ?? batch.rowGroupRowOffset + start,
            rowIndices,
            rowGroupRowIndices
          },
          function (this: Record<string, unknown>, key, value) {
            const original = this[key];
            if (typeof original === 'bigint') return {'loaders.gl.bigint': String(original)};
            if (original instanceof Uint8Array) return {'loaders.gl.bytes': Array.from(original)};
            return value;
          }
        )
      );
      yield new RecordBatch(recordBatch.schema, recordBatch.data, metadata);
      start += length;
    }
  }
}
