// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DataType,
  SyncDataType,
  BatchableDataType,
  Loader,
  LoaderOptions
} from '@loaders.gl/loader-utils';
import {
  concatenateArrayBuffersAsync,
  isPromise,
  isResponse,
  isReadableStream,
  isAsyncIterable,
  isIterable,
  isIterator,
  isBlob,
  isBuffer,
  isArrayBufferLike,
  toArrayBuffer,
  toArrayBufferView
} from '@loaders.gl/loader-utils';
import {makeIterator} from '../../iterators/make-iterator/make-iterator';
import {checkResponse, makeResponse} from '../utils/response-utils';

const ERR_DATA = 'Cannot convert supplied data type';

/**
 * Returns an {@link ArrayBuffer} or string from the provided data synchronously.
 * Supports `ArrayBuffer`, `ArrayBufferView`, and `ArrayBufferLike` (e.g. `SharedArrayBuffer`)
 * while preserving typed array view offsets.
 */
// eslint-disable-next-line complexity
export function getArrayBufferOrStringFromDataSync(
  data: SyncDataType,
  loader: Loader,
  options: LoaderOptions
): ArrayBuffer | string {
  if (loader.text && typeof data === 'string') {
    return data;
  }

  if (isBuffer(data)) {
    data = data.buffer;
  }

  if (isArrayBufferLike(data)) {
    const bufferSource = toArrayBufferView(data);
    if (loader.text && !loader.binary) {
      const textDecoder = new TextDecoder('utf8');
      return textDecoder.decode(bufferSource);
    }
    return toArrayBuffer(bufferSource);
  }

  throw new Error(ERR_DATA);
}

/**
 * Resolves the provided data into an {@link ArrayBuffer} or string asynchronously.
 * Accepts the full {@link DataType} surface including responses and async iterables.
 */
export async function getArrayBufferOrStringFromData(
  data: DataType,
  loader: Loader,
  options: LoaderOptions
): Promise<ArrayBuffer | string> {
  if (typeof data === 'string' || isArrayBufferLike(data)) {
    return getArrayBufferOrStringFromDataSync(data as SyncDataType, loader, options);
  }

  // Blobs and files are FileReader compatible
  if (isBlob(data)) {
    data = await makeResponse(data);
  }

  if (isResponse(data)) {
    await checkResponse(data);
    return loader.binary ? await data.arrayBuffer() : await data.text();
  }

  if (isReadableStream(data)) {
    // @ts-expect-error TS2559 options type
    data = makeIterator(data as ReadableStream, options);
  }

  if (isIterable(data) || isAsyncIterable(data)) {
    // Assume arrayBuffer iterator - attempt to concatenate
    return concatenateArrayBuffersAsync(data as AsyncIterable<ArrayBufferLike>);
  }

  throw new Error(ERR_DATA);
}

/**
 * Normalizes batchable inputs into async iterables for batch parsing flows.
 * Supports synchronous iterables, async iterables, fetch responses, readable streams, and
 * single binary chunks (including typed array views and `ArrayBufferLike` values).
 */
export async function getAsyncIterableFromData(
  data: BatchableDataType,
  options: LoaderOptions
): Promise<
  AsyncIterable<ArrayBufferLike | ArrayBufferView> | Iterable<ArrayBufferLike | ArrayBufferView>
> {
  if (isPromise(data)) {
    data = await data;
  }

  if (isIterator(data)) {
    return data as AsyncIterable<ArrayBuffer>;
  }

  if (isResponse(data)) {
    // Note Since this function is not async, we currently can't load error message, just status
    await checkResponse(data);
    // TODO - bug in polyfill, body can be a Promise under Node.js
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const body = await data.body;
    if (!body) {
      throw new Error(ERR_DATA);
    }
    return makeIterator(body, options as any);
  }

  if (isBlob(data) || isReadableStream(data)) {
    return makeIterator(data as Blob | ReadableStream, options as any);
  }

  if (isAsyncIterable(data)) {
    return data as AsyncIterable<ArrayBufferLike | ArrayBufferView>;
  }

  if (isIterable(data)) {
    return data as Iterable<ArrayBufferLike | ArrayBufferView>;
  }

  // @ts-expect-error TODO - fix type mess
  return getIterableFromData(data);
}

/**
 * Returns a readable stream for streaming loader inputs when available.
 */
export async function getReadableStream(data: BatchableDataType): Promise<ReadableStream> {
  if (isReadableStream(data)) {
    return data as ReadableStream;
  }
  if (isResponse(data)) {
    // @ts-ignore
    if (!data.body) {
      throw new Error(ERR_DATA);
    }
    return data.body;
  }
  const response = await makeResponse(data);
  // @ts-ignore
  if (!response.body) {
    throw new Error(ERR_DATA);
  }
  return response.body;
}

// HELPERS

function getIterableFromData(data: string | ArrayBuffer | SharedArrayBuffer | ArrayBufferView) {
  // generate an iterator that emits a single chunk
  if (ArrayBuffer.isView(data)) {
    return (function* oneChunk() {
      yield toArrayBuffer(data);
    })();
  }

  if (isArrayBufferLike(data)) {
    return (function* oneChunk() {
      yield toArrayBuffer(data);
    })();
  }

  if (isIterator(data)) {
    return data;
  }

  if (isIterable(data)) {
    return data[Symbol.iterator]();
  }

  throw new Error(ERR_DATA);
}
