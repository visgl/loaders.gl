// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {IteratorOptions} from './make-iterator';

const DEFAULT_CHUNK_SIZE = 256 * 1024;

/**
 * Returns an iterator that breaks a big string into chunks and yields them one-by-one as ArrayBuffers
 * @param blob string to iterate over
 * @param options
 * @param options.chunkSize
 */
export function* makeStringIterator(
  string: string,
  options?: IteratorOptions
): Iterable<ArrayBuffer> {
  const chunkSize = options?.chunkSize || DEFAULT_CHUNK_SIZE;

  let offset = 0;
  const textEncoder = new TextEncoder();
  while (offset < string.length) {
    // Create a chunk of the right size
    const chunkLength = Math.min(string.length - offset, chunkSize);
    const chunk = string.slice(offset, offset + chunkLength);
    offset += chunkLength;

    // yield an ArrayBuffer chunk
    yield textEncoder.encode(chunk);
  }
}
