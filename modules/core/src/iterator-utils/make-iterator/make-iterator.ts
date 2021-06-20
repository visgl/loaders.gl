import type {ReadStream} from 'fs';

import {makeStringIterator} from './string-iterator';
import {makeArrayBufferIterator} from './array-buffer-iterator';
import {makeBlobIterator} from './blob-iterator';
import {assert} from '@loaders.gl/loader-utils';
import {makeStreamIterator} from './stream-iterator';
import {isBlob, isReadableStream, isResponse} from '../../javascript-utils/is-type';

/**
 * @param [options.chunkSize]
 */
export type IteratorOptions = {
  chunkSize?: number;
};

/**
 * Returns an iterator that breaks its input into chunks and yields them one-by-one.
 * @param data
 * @param options
 * @returns
 * This function can e.g. be used to enable data sources that can only be read atomically
 * (such as `Blob` and `File` via `FileReader`) to still be parsed in batches.
 */
export function makeIterator(
  data: ArrayBuffer | string | Blob | Response | ReadableStream | ReadStream,
  options?: IteratorOptions
): AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer> {
  if (typeof data === 'string') {
    // Note: Converts string chunks to binary
    return makeStringIterator(data, options);
  }
  if (data instanceof ArrayBuffer) {
    return makeArrayBufferIterator(data, options);
  }
  if (isBlob(data)) {
    return makeBlobIterator(data as Blob, options);
  }
  if (isReadableStream(data)) {
    return makeStreamIterator(data as ReadableStream);
  }
  if (isResponse(data)) {
    const response = data as Response;
    return makeStreamIterator(response.body as ReadableStream);
  }
  throw new Error('makeIterator');
}
