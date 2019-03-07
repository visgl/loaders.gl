/* global URL */
/* global Buffer */
import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import http from 'http';
import https from 'https';
import util from 'util';

import {resolvePath} from './file-aliases';
import decodeDataUri from '../data-uri-utils/decode-data-uri';
import {toArrayBuffer} from '../binary-utils/binary-utils';
import {TextDecoder} from '../binary-utils/text-encoding';
import {concatenateReadStream} from '../async-iterator-utils/stream-utils';

const isNode = Boolean(fs && fs.readFile);

const DEFAULT_OPTIONS = {
  dataType: 'arrayBuffer'
};

// Under Node.js we return a mock "fetch response object"
// so that apps can use the same API as in the browser.
//
// Note: This is intended to be a lightweight implementation and will have limitations.
// Apps that require more complete fech emulation in Node
// are encouraged to use dedicated fetch polyfill modules.

// See https://developer.mozilla.org/en-US/docs/Web/API/Response
class MockFetchResponseObject {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.bodyUsed = false;
  }

  // Subset of Properties

  get headers() {
    return {};
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
    return textDecoder.parse(arrayBuffer);
  }

  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }
}

export async function fetchFile(url, options) {
  url = resolvePath(url);
  return new MockFetchResponseObject(url, options);
}

// Returns a promise that resolves to a readable stream
export async function createReadStream(url, options) {
  url = resolvePath(url);

  // HANDLE DATA URLS IN NODE
  if (url.startsWith('data:')) {
    // TODO - need to return a stream wrapper
    return decodeDataUri(url);
  }

  const isRequest = url.startsWith('http:') || url.startsWith('https:');

  // HANDLE FILE STREAMS IN NODE
  if (!isRequest) {
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

// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
export async function readFile(url, options = {}) {
  url = resolvePath(url);
  options = getReadFileOptions(options);

  if (url.startsWith('data:')) {
    return Promise.resolve(decodeDataUri(url));
  }

  const isRequest = url.startsWith('http:') || url.startsWith('https:');
  if (isRequest) {
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

// In a few cases (data URIs, node.js) "files" can be read synchronously
export function readFileSync(url, options = {}) {
  url = resolvePath(url);
  options = getReadFileOptions(options);

  if (url.startsWith('data:')) {
    return decodeDataUri(url);
  }

  if (!isNode) {
    return null; // throw new Error('Cant load URI synchronously');
  }

  const buffer = fs.readFileSync(url, options, () => {});
  return buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer;
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
