import {RecordBatchReader} from 'apache-arrow';
import {isIterable, isIterator, assert} from '@loaders.gl/core';

export async function parseArrowInBatches(asyncIterator, options, onUpdate) {
  // Creates the appropriate RecordBatchReader subclasses from the input
  // This will also close the underlying source in case of early termination or errors
  const readers = await RecordBatchReader.readAll(asyncIterator);

  // As an optimization, return a non-async iterator
  if (isIterable(readers)) {
    return (function* arrowIterator() {
      for (const reader of readers) {
        for (const batch of reader) {
          yield processBatch(batch, reader);
        }
        break; // only processing one stream of batches
      }
    })();
  }

  return (async function* arrowAsyncIterator() {
    for await (const reader of readers) {
      for await (const batch of reader) {
        yield processBatch(batch, reader);
      }
      break; // only processing one stream of batches
    }
  })();
}

export async function parseArrowInBatchesSync(iterator, options, onUpdate) {
  // Creates the appropriate RecordBatchReader subclasses from the input
  // This will also close the underlying source in case of early termination or errors
  const readers = RecordBatchReader.readAll(iterator);

  // Check that `readers` is not a Promise, and is iterable
  if (isIterable(readers) || isIterator(readers)) {
    return (function* arrowIterator() {
      for (const reader of readers) {
        for (const batch of reader) {
          yield processBatch(batch);
        }
        break; // only processing one stream of batches
      }
    })();
  }

  return assert(false);
}

function processBatch(batch, on) {
  const values = {
    metadata: batch.schema.metadata,
    length: batch.length
  };
  batch.schema.fields.forEach(({name}, index) => {
    values[name] = batch.getChildAt(index).toArray();
  });
  return values;
}
