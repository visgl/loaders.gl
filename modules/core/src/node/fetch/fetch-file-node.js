/* global URL */
/* global Buffer */
import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import http from 'http';
import https from 'https';
import util from 'util';

import {toArrayBuffer} from '../../javascript-utils/binary-utils';
import {TextDecoder} from '../../javascript-utils/text-encoding';
import {concatenateReadStream} from '../../javascript-utils/stream-utils';
import decodeDataUri from './decode-data-uri';

const DEFAULT_OPTIONS = {
  dataType: 'arrayBuffer'
};

const isNode = Boolean(fs && fs.readFile);
const isDataURL = url => url.startsWith('data:');
const isRequestURL = url => url.startsWith('http:') || url.startsWith('https:');

// Under Node.js we return a mock "fetch response object"
// so that apps can use the same API as in the browser.
//
// Note: This is intended to be a lightweight implementation and will have limitations.
// Apps that require more complete fech emulation in Node
// are encouraged to use dedicated fetch polyfill modules.
class NodeHeaders {
  constructor(response) {
    this.reponse = response;
  }

  get(header) {
    if (this.response.httpResponse) {
      return this.response.httpResponse.getHeaders()[header];
    }
    switch (header) {
      case 'Content-Length':
        return this._getContentLength();
      default:
    }
    return undefined;
  }

  _getContentLength() {
    return this._contentLength;
  }
}

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
    if (isRequestURL(this.url)) {
      return new NodeHeaders(this);
    }

    if (isDataURL(this.url)) {
      return {
        'Content-Length': this.url.length
      };
    }
    if (isRequestURL(this.repsonse.url)) {
      return {};
    }

    // File URL
    // TODO - how to handle non-existing file, this presumably just throws
    const stats = fs.statSync(this.response.url);
    return {
      'Content-Length': stats.size
    };
  }
}

export async function fetchFile(url, options) {
  return new NodeFetchResponse(url, options);
}

// In a few cases (data URIs, node.js) "files" can be read synchronously
export function readFileSync(url, options = {}) {
  options = getReadFileOptions(options);

  if (isDataURL(url)) {
    return decodeDataUri(url);
  }

  if (!isNode) {
    return null; // throw new Error('Cant load URI synchronously');
  }

  const buffer = fs.readFileSync(url, options, () => {});
  return buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer;
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

  const readFileAsync = util.promisify(fs.readFile);
  const buffer = await readFileAsync(url, options);
  return buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer;
}

// Returns a promise that resolves to a readable stream
export async function createReadStream(url, options) {

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
