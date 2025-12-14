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
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {
  isResponse,
  isReadableStream,
  isAsyncIterable,
  isIterable,
  isIterator,
  isBlob,
  isBuffer
} from '../../javascript-utils/is-type';
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
    // @ts-ignore
    data = data.buffer;
  }

  if (isArrayBufferLike(data)) {
    const bufferSource = ensureBufferSource(data);
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
    const response = data as Response;
    await checkResponse(response);
    return loader.binary ? await response.arrayBuffer() : await response.text();
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
  if (isIterator(data)) {
    return data as AsyncIterable<ArrayBuffer>;
  }

  if (isResponse(data)) {
    const response = data as Response;
    // Note Since this function is not async, we currently can't load error message, just status
    await checkResponse(response);
    // TODO - bug in polyfill, body can be a Promise under Node.js
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const body = await response.body;
    // TODO - body can be null?
    return makeIterator(body as ReadableStream<Uint8Array>, options as any);
  }

  if (isBlob(data) || isReadableStream(data)) {
    return makeIterator(data as Blob | ReadableStream, options as any);
  }

  if (isAsyncIterable(data)) {
    return data as AsyncIterable<ArrayBufferLike | ArrayBufferView>;
  }

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
    return data.body;
  }
  const response = await makeResponse(data);
  // @ts-ignore
  return response.body;
}

// HELPERS

function getIterableFromData(data) {
  // generate an iterator that emits a single chunk
  if (ArrayBuffer.isView(data)) {
    return (function* oneChunk() {
      yield toArrayBuffer(data);
    })();
  }

  if (isArrayBufferLike(data)) {
    return (function* oneChunk() {
      yield toArrayBuffer(ensureBufferSource(data));
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

function isArrayBufferLike(value: unknown): value is ArrayBufferLike | ArrayBufferView {
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value) || hasByteLength(value);
}

function hasByteLength(value: unknown): value is {byteLength: number} {
  return Boolean(value && typeof value === 'object' && 'byteLength' in (value as object));
}

function ensureBufferSource(data: ArrayBufferLike | ArrayBufferView): ArrayBuffer | ArrayBufferView {
  if (ArrayBuffer.isView(data)) {
    return data;
  }

  // Create a view to support ArrayBufferLike sources such as SharedArrayBuffer
  return new Uint8Array(data as ArrayBufferLike);
}

function toArrayBuffer(bufferSource: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (bufferSource instanceof ArrayBuffer) {
    return bufferSource;
  }

  const {buffer, byteOffset, byteLength} = bufferSource;
  return copyToArrayBuffer(buffer, byteOffset, byteLength);
}

function copyToArrayBuffer(
  buffer: ArrayBufferLike,
  byteOffset = 0,
  byteLength = buffer.byteLength - byteOffset
): ArrayBuffer {
  const view = new Uint8Array(buffer, byteOffset, byteLength);
  const copy = new Uint8Array(view.length);
  copy.set(view);
  return copy.buffer;
}
