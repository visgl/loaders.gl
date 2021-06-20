// TODO - this import defeats the sophisticated typescript checking in ArrowJS
import {RecordBatchReader} from 'apache-arrow';
// import {isIterable} from '@loaders.gl/core';

/**
 */
export function parseArrowInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
): AsyncIterable<any> {
  // Creates the appropriate RecordBatchReader subclasses from the input
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

  async function* makeArrowAsyncIterator() {
    const readers = await RecordBatchReader.readAll(asyncIterator);
    for await (const reader of readers) {
      for await (const batch of reader) {
        yield processBatch(batch);
      }
      break; // only processing one stream of batches
    }
  }
  return makeArrowAsyncIterator();
}

function processBatch(batch) {
  const values = {
    metadata: batch.schema.metadata,
    length: batch.length
  };
  batch.schema.fields.forEach(({name}, index) => {
    values[name] = batch.getChildAt(index).toArray();
  });
  return values;
}
