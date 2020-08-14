import {concatenateArrayBuffers} from '../binary-utils/array-buffer-utils';

// GENERAL UTILITIES

/**
 * Iterate over async iterator, without resetting iterator if end is not reached
 * - forEach intentionally does not reset iterator if exiting loop prematurely
 *   so that iteration can continue in a second loop
 * - It is recommended to use a standard for-await as last loop to ensure
 *   iterator gets properly reset
 *
 * TODO - optimize using sync iteration if argument is an Iterable?
 *
 * @param iterator
 * @param visitor
 */
export async function forEach(iterator, visitor) {
  // eslint-disable-next-line
  while (true) {
    const {done, value} = await iterator.next();
    if (done) {
      iterator.return();
      return;
    }
    const cancel = visitor(value);
    if (cancel) {
      return;
    }
  }
}

// Breaking big data into iterable chunks, concatenating iterable chunks into big data objects

/**
 * Concatenates all data chunks yielded by an (async) iterator
 * Supports strings and ArrayBuffers
 *
 * This function can e.g. be used to enable atomic parsers to work on (async) iterator inputs
 */
export async function concatenateChunksAsync(asyncIterator) {
  let arrayBuffer = new ArrayBuffer(0);
  let string = '';
  for await (const chunk of asyncIterator) {
    if (typeof chunk === 'string') {
      string += chunk;
    } else {
      arrayBuffer = concatenateArrayBuffers(arrayBuffer, chunk);
    }
  }
  return string || arrayBuffer;
}
