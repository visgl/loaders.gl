// Breaking big data into iterable chunks, concatenating iterable chunks into big data objects
import {isAsyncIterable, isIterator} from '../javascript-utils/is-type';
import {makeStringIterator} from './iterators/string-iterator';
import {makeArrayBufferIterator} from './iterators/array-buffer-iterator';
import {makeStreamIterator} from './iterators/stream-iterator';
import {assert} from '@loaders.gl/loader-utils';

/**
 * Returns an iterator that breaks a big `ArrayBuffer` or string into chunks and yields them one-by-one.
 *
 * @param data
 * @param {object} options
 * @param {number} [options.chunkSize]
 * @returns iterator that yields chunks of specified size
 *
 * This function can e.g. be used to enable data sources that can only be read atomically
 * (such as `Blob` and `File` via `FileReader`) to still be parsed in batches.
export function* makeStringIterator(data, options) {
  if (typeof data === 'string') {
    yield* makeStringIterator(data, options);
    return;
  }
  makeIterator(data, options);
  if (data instanceof ArrayBuffer) {
    yield*
    return;
  }
}
*/

/**
 * Returns an iterator that breaks a big `ArrayBuffer` or string into chunks and yields them one-by-one.
 *
 * @param data
 * @param {object} options
 * @param {number} [options.chunkSize]
 * @returns iterator that yields chunks of specified size
 *
 * This function can e.g. be used to enable data sources that can only be read atomically
 * (such as `Blob` and `File` via `FileReader`) to still be parsed in batches.
 */
export async function* makeIterator(data, options = {}) {
  if (typeof data === 'string') {
    // Note: Converts string chunks to binary
    const stringIterator = makeStringIterator(data, options);
    return;
  }
  if (data instanceof ArrayBuffer) {
    yield* makeArrayBufferIterator(data, options);
    return;
  }
  if (data instanceof Blob) {
    yield* makeBlobIterator(data, options);
    return;
  }
  if (data instanceof ReadableStream) {
    yield *makeStreamIterator(data);
    return;
  }
  assert(false);
}
