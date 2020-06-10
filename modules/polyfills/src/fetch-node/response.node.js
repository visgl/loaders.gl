/* global TextDecoder */
import assert from '../utils/assert';

// Under Node.js we return a mock "fetch response object"
// so that apps can use the same API as in the browser.
//
// Note: This is intended to be a lightweight implementation and will have limitations.
// Apps that require more complete fech emulation in Node
// are encouraged to use dedicated fetch polyfill modules.

// See https://developer.mozilla.org/en-US/docs/Web/API/Response
export default class Response {
  // TODO - handle ArrayBuffer, ArrayBufferView, Buffer
  constructor(body, options = {}) {
    const {headers, status = 200, statusText, url} = options;

    this._url = url;
    this._ok = !statusText;
    this._status = status; // TODO - handle errors and set status
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
