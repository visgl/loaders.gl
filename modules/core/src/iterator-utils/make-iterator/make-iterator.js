/* global Blob, ReadableStream, Response */
import {makeStringIterator} from './string-iterator';
import {makeArrayBufferIterator} from './array-buffer-iterator';
import {makeBlobIterator} from './blob-iterator';
import {makeStreamIterator} from './stream-iterator';
import {assert} from '@loaders.gl/loader-utils';

/**
 * Returns an iterator that breaks its input into chunks and yields them one-by-one.
 *
 * @param data a big `ArrayBuffer`, `Blob` or string, or a stream.
 * @param {object} options
 * @param {number} [options.chunkSize]  max number of bytes per chunk. chunkSize is ignored for streams.
 * @returns iterator or async iterator that yields chunks of specified size.
 *
 * This function can e.g. be used to enable data sources that can only be read atomically
 * (such as `Blob` and `File` via `FileReader`) to still be parsed in batches.
 */
export function makeIterator(data, options = {}) {
  if (typeof data === 'string') {
    // Note: Converts string chunks to binary
    return makeStringIterator(data, options);
  }
  if (data instanceof ArrayBuffer) {
    return makeArrayBufferIterator(data, options);
  }
  if (data instanceof Blob) {
    return makeBlobIterator(data, options);
  }
  if (data instanceof ReadableStream) {
    return makeStreamIterator(data);
  }
  if (data instanceof Response) {
    return makeStreamIterator(data.body);
  }
  assert(false);
}
