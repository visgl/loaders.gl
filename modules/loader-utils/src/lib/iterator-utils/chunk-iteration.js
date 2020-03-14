// Breaking big data into iterable chunks, concatenating iterable chunks into big data objects

import {concatenateArrayBuffers} from '../javascript-utils/memory-copy-utils';

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

/**
 * Returns an iterator that breaks a big `ArrayBuffer` or string into chunks and yields them one-by-one.
 *
 * @param bigArrayBufferOrString
 * @param options
 * @param options.chunkSize
 * @returns iterator that yields chunks of specified size
 *
 * This function can e.g. be used to enable data sources that can only be read atomically
 * (such as `Blob` and `File` via `FileReader`) to still be parsed in batches.
 */
export function* makeChunkIterator(bigArrayBufferOrString, options = {}) {
  if (typeof bigArrayBufferOrString === 'string') {
    yield* makeStringChunkIterator(bigArrayBufferOrString, options);
    return;
  }
  if (bigArrayBufferOrString instanceof ArrayBuffer) {
    yield* makeArrayBufferChunkIterator(bigArrayBufferOrString, options);
    return;
  }
  throw new Error('assert');
}

/**
 * Helper: Breaks a big ArrayBuffer into chunks and returns an iterator that yields them one-by-one
 */
function* makeArrayBufferChunkIterator(arrayBuffer, options = {}) {
  const {chunkSize = 256 * 1024} = options;

  let byteOffset = 0;

  while (byteOffset < arrayBuffer.byteLength) {
    // Create a chunk of the right size
    const chunkByteLength = Math.min(arrayBuffer.byteLength - byteOffset, chunkSize);
    const chunk = new ArrayBuffer(chunkByteLength);

    // Copy data from the big chunk
    const sourceArray = new Uint8Array(arrayBuffer, byteOffset, chunkByteLength);
    const chunkArray = new Uint8Array(chunk);
    chunkArray.set(sourceArray);

    // yield the chunk
    byteOffset += chunkByteLength;
    yield chunk;
  }
}

/**
 * Helper: Breaks a big string into chunks and returns an iterator that yields them one-by-one
 */
function* makeStringChunkIterator(string, options = {}) {
  const {chunkSize = 256 * 1024} = options;

  let offset = 0;

  while (offset < string.length) {
    // Create a chunk of the right size
    const chunkLength = Math.min(string.length - offset, chunkSize);
    const chunk = string.slice(offset, offset + chunkLength);
    offset += chunkLength;

    // yield the chunk
    yield chunk;
  }
}
