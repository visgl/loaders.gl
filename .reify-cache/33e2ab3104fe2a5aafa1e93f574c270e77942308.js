"use strict";module.export({getUrlFromData:()=>getUrlFromData,getSizeFromData:()=>getSizeFromData,getArrayBufferOrStringFromDataSync:()=>getArrayBufferOrStringFromDataSync,getArrayBufferOrStringFromData:()=>getArrayBufferOrStringFromData,getAsyncIteratorFromData:()=>getAsyncIteratorFromData,getIteratorFromData:()=>getIteratorFromData});var isFetchResponse,isReadableStream,isAsyncIterable,isIterable,isIterator;module.link('../../javascript-utils/is-type',{isFetchResponse(v){isFetchResponse=v},isReadableStream(v){isReadableStream=v},isAsyncIterable(v){isAsyncIterable=v},isIterable(v){isIterable=v},isIterator(v){isIterator=v}},0);var getStreamIterator;module.link('../../javascript-utils/stream-utils',{getStreamIterator(v){getStreamIterator=v}},1);var TextDecoder;module.link('../../javascript-utils/text-encoding',{TextDecoder(v){TextDecoder=v}},2);









const ERR_DATA = 'Cannot convert supplied data type';

function getUrlFromData(data) {
  return isFetchResponse(data) ? data.url : null;
}

function getSizeFromData(data) {
  return isFetchResponse(data) ? data.headers.get('Content-Length') : null;
}
function getArrayBufferOrStringFromDataSync(data, loader) {
  if (loader.text && typeof data === 'string') {
    return data;
  }

  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    const arrayBuffer = data.buffer || data;
    if (loader.text && !loader.binary) {
      const textDecoder = new TextDecoder('utf8');
      return textDecoder.decode(arrayBuffer);
    }
    return arrayBuffer;
  }

  throw new Error(ERR_DATA);
}

// Convert async iterator to a promise
async function getArrayBufferOrStringFromData(data, loader) {
  // Resolve any promise
  data = await data;

  const isArrayBuffer = data instanceof ArrayBuffer || ArrayBuffer.isView(data);
  if (typeof data === 'string' || isArrayBuffer) {
    return getArrayBufferOrStringFromDataSync(data, loader);
  }

  if (isFetchResponse(data)) {
    return loader.binary ? await data.arrayBuffer() : data.text();
  }

  // if (isIterable(data) || isAsyncIterable(data)) {
  // }

  // Assume arrayBuffer iterator - attempt to concatenate
  // return concatenateAsyncIterator(data);

  throw new Error(ERR_DATA);
}

async function getAsyncIteratorFromData(data, loader) {
  if (isIterator(data)) {
    return data;
  }

  if (isFetchResponse(data)) {
    return getStreamIterator(data.body);
  }

  if (isReadableStream(data)) {
    return getStreamIterator(data);
  }

  if (isAsyncIterable(data)) {
    return data[Symbol.asyncIterator]();
  }

  return getIteratorFromData(data, loader);
}

async function getIteratorFromData(data, loader) {
  // generate an iterator that emits a single chunk
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return (function* oneChunk() {
      yield data.buffer || data;
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
