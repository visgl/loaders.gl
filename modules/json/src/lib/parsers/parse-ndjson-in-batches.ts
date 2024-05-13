// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableBatch} from '@loaders.gl/schema';
import {TableBatchBuilder} from '@loaders.gl/schema';
import {
  LoaderOptions,
  makeLineIterator,
  makeNumberedLineIterator,
  makeTextDecoderIterator
} from '@loaders.gl/loader-utils';

export async function* parseNDJSONInBatches(
  binaryAsyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: LoaderOptions
): AsyncIterable<TableBatch> {
  const textIterator = makeTextDecoderIterator(binaryAsyncIterator);
  const lineIterator = makeLineIterator(textIterator);
  const numberedLineIterator = makeNumberedLineIterator(lineIterator);

  const schema = null;
  const shape = 'row-table';
  // @ts-ignore
  const tableBatchBuilder = new TableBatchBuilder(schema, {
    ...options,
    shape
  });

  for await (const {counter, line} of numberedLineIterator) {
    try {
      const row = JSON.parse(line);
      tableBatchBuilder.addRow(row);
      tableBatchBuilder.chunkComplete(line);
      const batch = tableBatchBuilder.getFullBatch();
      if (batch) {
        yield batch;
      }
    } catch (error) {
      throw new Error(`NDJSONLoader: failed to parse JSON on line ${counter}`);
    }
  }

  const batch = tableBatchBuilder.getFinalBatch();
  if (batch) {
    yield batch;
  }
}
