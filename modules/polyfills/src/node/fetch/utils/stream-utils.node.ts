import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import http from 'http';
import https from 'https';
import zlib from 'zlib';

import {toArrayBuffer} from './decode-data-uri.node';

function isRequestURL(url: string): boolean {
  return url.startsWith('http:') || url.startsWith('https:');
}

// Returns a promise that resolves to a readable stream
export async function createReadStream(url, options): Promise<any> {
  // Handle file streams in node
  if (!isRequestURL(url)) {
    const noqueryUrl = url.split('?')[0];
    // Now open the stream
    return await new Promise((resolve, reject) => {
      // @ts-ignore
      const stream = fs.createReadStream(noqueryUrl, {encoding: null});
      stream.once('readable', () => resolve(stream));
      stream.on('error', (error) => reject(error));
    });
  }

  // HANDLE HTTP/HTTPS REQUESTS IN NODE
  // TODO: THIS IS BAD SINCE WE RETURN A PROMISE INSTEAD OF A STREAM
  return await new Promise((resolve, reject) => {
    const requestFunction = url.startsWith('https:') ? https.request : http.request;
    const requestOptions = getRequestOptions(url, options);
    const req = requestFunction(requestOptions, (res) => resolve(res));
    req.on('error', (error) => reject(error));
    req.end();
  });
}

export function decompressReadStream(readStream, headers) {
  switch (headers.get('content-encoding')) {
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

// HELPERS

function getRequestOptions(url: string, options?: {fetch?: typeof fetch; headers?}) {
  // Ensure header keys are lower case so that we can merge without duplicates
  const originalHeaders = options?.headers || {};
  const headers = {};
  for (const key of Object.keys(originalHeaders)) {
    headers[key.toLowerCase()] = originalHeaders[key];
  }

  // Add default accept-encoding to headers
  headers['accept-encoding'] = headers['accept-encoding'] || 'gzip,br,deflate';

  const urlObject = new URL(url);
  return {
    hostname: urlObject.hostname,
    path: urlObject.pathname,
    method: 'GET',
    // Add options and user provided 'options.fetch' overrides if available
    ...options,
    ...options?.fetch,
    // Override with updated headers with accepted encodings:
    headers
  };
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
