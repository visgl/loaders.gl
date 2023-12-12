// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTableBatch} from '../lib/arrow-table';
import * as arrow from 'apache-arrow';
import {ArrowLoaderOptions} from '../arrow-loader';
// import {isIterable} from '@loaders.gl/core';

/**
 */
export function parseArrowInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: ArrowLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  // Creates the appropriate arrow.RecordBatchReader subclasses from the input
  // This will also close the underlying source in case of early termination or errors

  // As an optimization, return a non-async iterator
  /*
  if (isIterable(readers)) {
    function* makeArrowIterator() {
      for (const reader of readers) {
        for (const batch of reader) {
          yield processBatch(batch, reader);
        }
        break; // only processing one stream of batches
      }
    }
    const arrowIterator = makeArrowIterator();
  }
  */

  async function* makeArrowAsyncIterator(): AsyncIterator<ArrowTableBatch> {
    // @ts-ignore
    const readers = arrow.RecordBatchReader.readAll(asyncIterator);
    for await (const reader of readers) {
      for await (const recordBatch of reader) {
        // use options.batchDebounceMs to add a delay between batches if needed (use case: incremental loading)
        if (options?.arrow?.batchDebounceMs !== undefined && options?.arrow?.batchDebounceMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, options.arrow?.batchDebounceMs || 0));
        }
        const arrowTabledBatch: ArrowTableBatch = {
          shape: 'arrow-table',
          batchType: 'data',
          data: new arrow.Table([recordBatch]),
          length: recordBatch.data.length
        };
        // processBatch(recordBatch);
        yield arrowTabledBatch;
      }
      break; // only processing one stream of batches
    }
  }

  return makeArrowAsyncIterator() as any; // as AsyncIterator<ArrowTableBatch>;
}

// function processBatch(batch: RecordBatch): ArrowTableBatch {
//   const values = {};
//   batch.schema.fields.forEach(({name}, index) => {
//     values[name] = batch.getChildAt(index)?.toArray();
//   });
//   return {
//   };
// }
