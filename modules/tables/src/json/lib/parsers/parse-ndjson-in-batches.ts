// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableBatch} from '@loaders.gl/schema';
import {makeTableFromData, TableBatchBuilder} from '@loaders.gl/schema-utils';
import {
  LoaderOptions,
  makeLineIterator,
  makeNumberedLineIterator,
  makeTextDecoderIterator,
  toArrayBufferIterator
} from '@loaders.gl/loader-utils';

export async function* parseNDJSONInBatches(
  binaryAsyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: LoaderOptions
): AsyncIterable<TableBatch> {
  const textIterator = makeTextDecoderIterator(toArrayBufferIterator(binaryAsyncIterator));
  const lineIterator = makeLineIterator(textIterator);
  const numberedLineIterator = makeNumberedLineIterator(lineIterator);

  let tableBatchBuilder: TableBatchBuilder | null = null;

  for await (const {counter, line} of numberedLineIterator) {
    try {
      const row = JSON.parse(line);
      if (!tableBatchBuilder) {
        const table = makeTableFromData([row]);
        tableBatchBuilder = new TableBatchBuilder(table.schema!, {
          ...(options?.core || options),
          shape: table.shape
        });
      }
      tableBatchBuilder.addRow(row);
      tableBatchBuilder.chunkComplete(line);
      const batch = tableBatchBuilder.getFullBatch();
      if (batch) {
        yield batch;
      }
    } catch (_error) {
      throw new Error(`NDJSONLoader: failed to parse JSON on line ${counter}`);
    }
  }

  const batch = tableBatchBuilder?.getFinalBatch();
  if (batch) {
    yield batch;
  }
}
