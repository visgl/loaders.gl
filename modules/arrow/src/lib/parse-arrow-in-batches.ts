// TODO - this import defeats the sophisticated typescript checking in ArrowJS
import type {ArrowTableBatch} from './arrow-table';
import * as arrow from 'apache-arrow';
// import {isIterable} from '@loaders.gl/core';

/**
 */
export function parseArrowInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
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
