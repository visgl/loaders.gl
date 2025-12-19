// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import zlib from 'zlib';
import {Readable} from 'stream';

const isArrayBuffer = (x) => x && x instanceof ArrayBuffer;
const isBuffer = (x) => x && x instanceof Buffer;

/**
 *
 */
export function decompressReadStream(readStream: Readable, headers?: Headers) {
  switch (headers?.get('content-encoding')) {
    case 'br':
      return readStream.pipe(zlib.createBrotliDecompress());
    case 'gzip':
      return readStream.pipe(zlib.createGunzip());
    case 'deflate':
      return readStream.pipe(zlib.createDeflate());
    default:
      // No compression or an unknown one, just return it as is
      return readStream;
  }
}

/**
 *
 * @param readStream
 * @returns
 */
export async function concatenateReadStream(readStream): Promise<ArrayBuffer> {
  const arrayBufferChunks: ArrayBuffer[] = [];

  return await new Promise((resolve, reject) => {
    readStream.on('error', (error) => reject(error));

    // Once the readable callback has been added, stream switches to "flowing mode"
    // In Node 10 (but not 12 and 14) this causes `data` and `end` to never be called unless we read data here
    readStream.on('readable', () => readStream.read());

    readStream.on('data', (chunk) => {
      if (typeof chunk === 'string') {
        reject(new Error('Read stream not binary'));
      }
      arrayBufferChunks.push(toArrayBuffer(chunk));
    });

    readStream.on('end', () => {
      const arrayBuffer = concatenateArrayBuffers(arrayBufferChunks);
      resolve(arrayBuffer);
    });
  });
}

/**
 * Concatenate a sequence of ArrayBuffers
 * @return A concatenated ArrayBuffer
 * @note duplicates loader-utils since polyfills should be independent
 */
export function concatenateArrayBuffers(sources: (ArrayBuffer | Uint8Array)[]): ArrayBuffer {
  // Make sure all inputs are wrapped in typed arrays
  const sourceArrays = sources.map((source2) =>
    source2 instanceof ArrayBuffer ? new Uint8Array(source2) : source2
  );

  // Get length of all inputs
  const byteLength = sourceArrays.reduce((length, typedArray) => length + typedArray.byteLength, 0);

  // Allocate array with space for all inputs
  const result = new Uint8Array(byteLength);

  // Copy the subarrays
  let offset = 0;
  for (const sourceArray of sourceArrays) {
    result.set(sourceArray, offset);
    offset += sourceArray.byteLength;
  }

  // We work with ArrayBuffers, discard the typed array wrapper
  return result.buffer;
}

/**
 * @param data
 * @todo Duplicate of core
 */
export function toArrayBuffer(data: unknown): ArrayBuffer {
  if (isArrayBuffer(data)) {
    return data as ArrayBuffer;
  }

  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  if (isBuffer(data)) {
    // @ts-expect-error
    const typedArray = new Uint8Array(data);
    return typedArray.buffer;
  }

  // Careful - Node Buffers will look like ArrayBuffers (keep after isBuffer)
  if (ArrayBuffer.isView(data)) {
    return data.buffer;
  }

  if (typeof data === 'string') {
    const text = data;
    const uint8Array = new TextEncoder().encode(text);
    return uint8Array.buffer;
  }

  // HACK to support Blob polyfill
  // @ts-expect-error
  if (data && typeof data === 'object' && data._toArrayBuffer) {
    // @ts-expect-error
    return data._toArrayBuffer();
  }

  throw new Error(`toArrayBuffer(${JSON.stringify(data, null, 2).slice(10)})`);
}
