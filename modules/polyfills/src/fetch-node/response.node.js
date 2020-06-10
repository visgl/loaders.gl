/* global TextDecoder */
import {assert} from '@loaders.gl/core';

// Under Node.js we return a mock "fetch response object"
// so that apps can use the same API as in the browser.
//
// Note: This is intended to be a lightweight implementation and will have limitations.
// Apps that require more complete fech emulation in Node
// are encouraged to use dedicated fetch polyfill modules.

// See https://developer.mozilla.org/en-US/docs/Web/API/Response
export default class Response {
  constructor(url, options, body, headers, statusText, status) {
    this._url = url;
    this._ok = !Boolean(statusText);
    this._status = this._ok ? 200 : status || 400; // TODO - handle errors and set status
    this._statusText = statusText;
    this.options = options;
    this.bodyUsed = false;
    this._body = body;
    this._headers = headers;
  }

  // Subset of Properties

  get ok() {
    return this._ok;
  }

  get status() {
    return this._status;
  }

  get statusText() {
    return this._statusText;
  }

  get url() {
    return this._url;
  }

  get headers() {
    return this._headers;
  }

  // Returns a readable stream to the "body" of the response (or file)
  get body() {
    assert(!this.bodyUsed);
    this.bodyUsed = true;
    return this._body;
  }

  // Subset of Methods

  async arrayBuffer() {
    const data = await concatenateChunksAsync(this.body);
    return data;
  }

  async text() {
    const arrayBuffer = await this.arrayBuffer();
    const textDecoder = new TextDecoder();
    return textDecoder.decode(arrayBuffer);
  }

  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }
}

// HELPER FUNCTIONS

/**
 * Concatenates all data chunks yielded by an (async) iterator
 * Supports strings and ArrayBuffers
 *
 * This function can e.g. be used to enable atomic parsers to work on (async) iterator inputs
 */
async function concatenateChunksAsync(asyncIterator) {
  let arrayBuffer = new ArrayBuffer(0);
  for await (const chunk of asyncIterator) {
    arrayBuffer = concatenateArrayBuffers(arrayBuffer, chunk);
  }
  return arrayBuffer;
}

function concatenateArrayBuffers(source1, source2) {
  const sourceArray1 = source1 instanceof ArrayBuffer ? new Uint8Array(source1) : source1;
  const sourceArray2 = source2 instanceof ArrayBuffer ? new Uint8Array(source2) : source2;
  const temp = new Uint8Array(sourceArray1.byteLength + sourceArray2.byteLength);
  temp.set(sourceArray1, 0);
  temp.set(sourceArray2, sourceArray1.byteLength);
  return temp;
}
