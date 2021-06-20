import type {DataType, SyncDataType, BatchableDataType} from '@loaders.gl/loader-utils';
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
import {makeIterator} from '../../iterator-utils/make-iterator/make-iterator';
import {checkResponse, makeResponse} from '../utils/response-utils';

const ERR_DATA = 'Cannot convert supplied data type';

// eslint-disable-next-line complexity
export function getArrayBufferOrStringFromDataSync(
  data: SyncDataType,
  loader
): ArrayBuffer | string {
  if (loader.text && typeof data === 'string') {
    return data;
  }

  if (isBuffer(data)) {
    // @ts-ignore
    data = data.buffer;
  }

  if (data instanceof ArrayBuffer) {
    const arrayBuffer = data;
    if (loader.text && !loader.binary) {
      const textDecoder = new TextDecoder('utf8');
      return textDecoder.decode(arrayBuffer);
    }
    return arrayBuffer;
  }

  // We may need to handle offsets
  if (ArrayBuffer.isView(data)) {
    // TextDecoder is invoked on typed arrays and will handle offsets
    if (loader.text && !loader.binary) {
      const textDecoder = new TextDecoder('utf8');
      return textDecoder.decode(data);
    }

    let arrayBuffer = data.buffer;

    // Since we are returning the underlying arrayBuffer, we must create a new copy
    // if this typed array / Buffer is a partial view into the ArryayBuffer
    // TODO - this is a potentially unnecessary copy
    const byteLength = data.byteLength || data.length;
    if (data.byteOffset !== 0 || byteLength !== arrayBuffer.byteLength) {
      // console.warn(`loaders.gl copying arraybuffer of length ${byteLength}`);
      arrayBuffer = arrayBuffer.slice(data.byteOffset, data.byteOffset + byteLength);
    }
    return arrayBuffer;
  }

  throw new Error(ERR_DATA);
}

// Convert async iterator to a promise
export async function getArrayBufferOrStringFromData(
  data: DataType,
  loader
): Promise<ArrayBuffer | string> {
  const isArrayBuffer = data instanceof ArrayBuffer || ArrayBuffer.isView(data);
  if (typeof data === 'string' || isArrayBuffer) {
    return getArrayBufferOrStringFromDataSync(data as string | ArrayBuffer, loader);
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
    data = makeIterator(data as ReadableStream);
  }

  if (isIterable(data) || isAsyncIterable(data)) {
    // Assume arrayBuffer iterator - attempt to concatenate
    return concatenateArrayBuffersAsync(data as AsyncIterable<ArrayBuffer>);
  }

  throw new Error(ERR_DATA);
}

export async function getAsyncIteratorFromData(
  data: BatchableDataType
): Promise<AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>> {
  if (isIterator(data)) {
    return data as AsyncIterable<ArrayBuffer>;
  }

  if (isResponse(data)) {
    const response = data as Response;
    // Note Since this function is not async, we currently can't load error message, just status
    await checkResponse(response);
    // TODO - bug in polyfill, body can be a Promise under Node.js
    // @ts-ignore
    return makeIterator(response.body);
  }

  if (isBlob(data) || isReadableStream(data)) {
    return makeIterator(data as Blob | ReadableStream);
  }

  if (isAsyncIterable(data)) {
    return data[Symbol.asyncIterator]();
  }

  return getIteratorFromData(data);
}

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

function getIteratorFromData(data) {
  // generate an iterator that emits a single chunk
  if (ArrayBuffer.isView(data)) {
    return (function* oneChunk() {
      yield data.buffer;
    })();
  }

  if (data instanceof ArrayBuffer) {
    return (function* oneChunk() {
      yield data;
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
