/* global TextDecoder */
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
import {concatenateChunksAsync} from '../../iterator-utils/async-iteration';
import fetchFileReadable from '../fetch/fetch-file.browser';
import {checkFetchResponseStatus} from './check-errors';

const ERR_DATA = 'Cannot convert supplied data type';

// Extract a URL from `parse` arguments if possible
// If a fetch Response object or File/Blob were passed in get URL from those objects
export function getUrlFromData(data, url) {
  if (isResponse(data)) {
    url = url || data.url;
  } else if (isBlob(url)) {
    // File or Blob
    url = url.name;
  }
  // Strip any query string
  return typeof url === 'string' ? url.replace(/\?.*/, '') : url;
}

// eslint-disable-next-line complexity
export function getArrayBufferOrStringFromDataSync(data, loader) {
  if (loader.text && typeof data === 'string') {
    return data;
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
  if (ArrayBuffer.isView(data) || isBuffer(data)) {
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
export async function getArrayBufferOrStringFromData(data, loader) {
  // Resolve any promise
  data = await data;

  const isArrayBuffer = data instanceof ArrayBuffer || ArrayBuffer.isView(data);
  if (typeof data === 'string' || isArrayBuffer) {
    return getArrayBufferOrStringFromDataSync(data, loader);
  }

  // Blobs and files are FileReader compatible
  if (isBlob(data)) {
    data = await fetchFileReadable(data);
  }

  if (isResponse(data)) {
    const response = data;
    await checkFetchResponseStatus(response);
    return loader.binary ? await response.arrayBuffer() : await response.text();
  }

  if (isReadableStream(data)) {
    data = makeIterator(data);
  }

  if (isIterable(data) || isAsyncIterable(data)) {
    // Assume arrayBuffer iterator - attempt to concatenate
    return concatenateChunksAsync(data);
  }

  throw new Error(ERR_DATA);
}

export async function getAsyncIteratorFromData(data) {
  if (isIterator(data)) {
    return data;
  }

  if (isResponse(data)) {
    // Note Since this function is not async, we currently can't load error message, just status
    await checkFetchResponseStatus(data);
    // TODO - bug in polyfill, body can be a Promise under Node.js
    return makeIterator(data.body);
  }

  if (isBlob(data) || isReadableStream(data)) {
    return makeIterator(data);
  }

  if (isAsyncIterable(data)) {
    return data[Symbol.asyncIterator]();
  }

  return getIteratorFromData(data);
}

export function getIteratorFromData(data) {
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
