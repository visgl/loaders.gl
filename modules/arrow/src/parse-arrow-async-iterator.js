import {RecordBatchReader} from 'apache-arrow';

const isIterable = x => x && typeof x[Symbol.iterator] === 'function';

const isPromise = x =>
  x && (typeof x === 'object' || typeof x === 'function') && typeof x.then === 'function';

export function parseArrowAsIterator(inputIterator, options, onUpdate) {
  const reader = RecordBatchReader.from(inputIterator);

  // Check if a Promise or an AsyncIterable was returned
  if (isPromise(reader) || !isIterable(reader)) {
    throw new Error('arrow data source cannot be parsed using a synchronous iterator');
  }

  return (function* arrowIterator() {
    for (const batch of reader) {
      yield processBatch(batch);
    }
  })();
}

export async function parseArrowAsAsyncIterator(asyncIterator, options, onUpdate) {
  // Creates the appropriate RecordBatchReader subclasses from the input
  // This will also close the underlying source in case of early termination or errors
  const readers = RecordBatchReader.readAll(asyncIterator);

  // Check
  if (isIterable(readers)) {
    for (const reader of readers) {
      return (function* arrowIterator() {
        for (const batch of reader) {
          yield processBatch(batch);
        }
      })();
    }
  }

  return (async function* arrowAsyncIterator() {
    for await (const reader of readers) {
      for await (const batch of reader) {
        yield processBatch(batch);
      }
      break; // only processing one stream of batches
    }
  })();
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
