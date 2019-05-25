/* global URL */
/* global Buffer */
import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import http from 'http';
import https from 'https';
import util from 'util';

/* global TextDecoder */

import {toArrayBuffer} from './utils/to-array-buffer.node';
import decodeDataUri from './utils/decode-data-uri.node';
import {concatenateReadStream} from './utils/stream-utils.node';
import Headers from './headers.node';

const DEFAULT_OPTIONS = {
  dataType: 'arraybuffer'
};

// const isNode = Boolean(fs && fs.readFile);

const isDataURL = url => url.startsWith('data:');
const isRequestURL = url => url.startsWith('http:') || url.startsWith('https:');

// Under Node.js we return a mock "fetch response object"
// so that apps can use the same API as in the browser.
//
// Note: This is intended to be a lightweight implementation and will have limitations.
// Apps that require more complete fech emulation in Node
// are encouraged to use dedicated fetch polyfill modules.

// See https://developer.mozilla.org/en-US/docs/Web/API/Response
class NodeFetchResponse {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.bodyUsed = false;
    this._headers = null;
  }

  // Subset of Properties

  // get url()
  get headers() {
    this._headers = this._headers || this._getHeaders();
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
    return readFile(this.url, this.options);
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
      return this.url.length - 'data://'.length;
    }
    // File URL
    // TODO - how to handle non-existing file, this presumably just throws
    const stats = fs.statSync(this.url);
    return stats.size;
  }
}

export default function fetchNode(url, options) {
  return new NodeFetchResponse(url, options);
}

// HELPERS

function getReadFileOptions(options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  options.responseType = options.responseType || options.dataType;
  if (fs) {
    // set encoding for fs.readFile
    options.encoding = options.encoding || (options.dataType === 'text' ? 'utf8' : null);
  }
  return options;
}

// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
async function readFile(url, options = {}) {
  options = getReadFileOptions(options);

  if (isDataURL(url)) {
    return Promise.resolve(decodeDataUri(url));
  }

  if (isRequestURL(url)) {
    return new Promise((resolve, reject) => {
      options = {...new URL(url), ...options};
      const request = url.startsWith('https:') ? https.request : http.request;
      request(url, response => concatenateReadStream(response).then(resolve, reject));
    });
  }

  // Remove any query parameters when loading from file
  const queryIndex = url && url.lastIndexOf('?');
  url = queryIndex >= 0 ? url.substr(0, queryIndex) : url;

  const readFileAsync = util.promisify(fs.readFile);
  const buffer = await readFileAsync(url, options);
  return buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer;
}

// Returns a promise that resolves to a readable stream
async function createReadStream(url, options) {
  // Handle data urls in node, to match `fetch``
  if (isDataURL(url)) {
    // TODO - need to return a stream wrapper
    return decodeDataUri(url);
  }

  // Handle file streams in node
  if (!isRequestURL(url)) {
    return fs.createReadStream(url, options);
  }

  // HANDLE HTTP/HTTPS REQUESTS IN NODE
  return new Promise((resolve, reject) => {
    /* TODO - URL not available in Node.js v8? */
    options = {...new URL(url), ...options};
    const request = url.startsWith('https:') ? https.request : http.request;
    request(url, response => resolve(response));
  });
}
