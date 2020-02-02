/* global TextDecoder */
import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import Headers from './headers.node';
import {readFile, createReadStream} from './read-file.node';

const isDataURL = url => url.startsWith('data:');
const isRequestURL = url => url.startsWith('http:') || url.startsWith('https:');

// Under Node.js we return a mock "fetch response object"
// so that apps can use the same API as in the browser.
//
// Note: This is intended to be a lightweight implementation and will have limitations.
// Apps that require more complete fech emulation in Node
// are encouraged to use dedicated fetch polyfill modules.

// See https://developer.mozilla.org/en-US/docs/Web/API/Response
export default class NodeFetchResponse {
  constructor(url, options) {
    this._url = url;
    this._ok = true; // TODO - handle errors and set ok/status
    this._status = 200;
    this.options = options;
    this.bodyUsed = false;
    this._headers = null;

    // TODO - is this used?
    this.httpResponse = null;
  }

  // Subset of Properties

  get ok() {
    return this._ok;
  }

  get status() {
    return this._status;
  }

  get url() {
    return this._url;
  }

  get headers() {
    this._headers = this._headers || this._getHeaders();
    return this._headers;
  }

  // Returns a readable stream to the "body" of the response (or file)
  get body() {
    const {url, options} = this;
    this.bodyUsed = true;
    return createReadStream(url, options);
  }

  // Subset of Methods

  async arrayBuffer() {
    this.bodyUsed = true;
    const data = await readFile(this.url, this.options);
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

  // PRIVATE

  _getHeaders() {
    // Under Node.js we return a mock "fetch response object"
    // so that apps can use the same API as in the browser.
    //
    // Note: This is intended to be a lightweight implementation and will have limitations.
    // Apps that require more complete fech emulation in Node
    // are encouraged to use dedicated fetch polyfill modules.

    const headers = {};

    if (this.httpResponse) {
      const httpHeaders = this.httpResponse.getHeaders();
      for (const name in httpHeaders) {
        const header = headers[name];
        headers[name] = String(header);
      }
    } else {
      const contentLength = this._getContentLength();
      if (Number.isFinite(contentLength)) {
        headers['Content-Length'] = contentLength;
      }
    }

    return new Headers(headers);
  }

  _getContentLength() {
    if (isRequestURL(this.url)) {
      // Needs to be read from actual headers
      return null;
    } else if (isDataURL(this.url)) {
      // TODO - remove media type etc
      return this.url.length - 'data:'.length;
    }
    // File URL
    // TODO - how to handle non-existing file, this presumably just throws
    const stats = fs.statSync(this.url);
    return stats.size;
  }
}
