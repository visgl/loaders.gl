/* global URL */
/* global Buffer */
import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import http from 'http';
import https from 'https';
import util from 'util';

import {toArrayBuffer} from './utils/to-array-buffer.node';
import decodeDataUri from './utils/decode-data-uri.node';
import {concatenateReadStream} from './utils/stream-utils.node';

const DEFAULT_OPTIONS = {
  dataType: 'arraybuffer'
};

const isDataURL = url => url.startsWith('data:');
const isRequestURL = url => url.startsWith('http:') || url.startsWith('https:');

// Reads raw file data from:
// * http/http urls
// * data urls
// * files
export async function readFile(url, options = {}) {
  options = getReadFileOptions(options);

  if (isDataURL(url)) {
    const {arrayBuffer} = decodeDataUri(url);
    return Promise.resolve(arrayBuffer);
  }

  if (isRequestURL(url)) {
    return new Promise((resolve, reject) => {
      const requestOptions = getRequestOptions(url, options);
      const request = url.startsWith('https:') ? https.request : http.request;
      request(requestOptions, response =>
        concatenateReadStream(response).then(resolve, reject)
      ).end();
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
  // TODO: THIS IS BAD SINCE WE RETURN A PROMISE INSTEAD OF A STREAM
  return await new Promise((resolve, reject) => {
    const requestOptions = getRequestOptions(url, options);

    let req;
    if (url.startsWith('https:')) {
      req = https.request(requestOptions, res => resolve(res));
    } else {
      req = http.request(requestOptions, res => resolve(res));
    }
    req.on('error', error => reject(error));
    req.end();
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

function getRequestOptions(url, options = {}) {
  // Add accept-encoding to headers
  const headers = options.headers || {};
  headers['accept-encoding'] = headers['accept-encoding'] || 'gzip,br,deflate';

  const urlObject = new URL(url);
  return {
    hostname: urlObject.hostname,
    path: urlObject.pathname,
    method: 'GET',
    // Add options and user provided 'options.fetch' overrides if available
    ...options,
    ...(options.fetch || {}),
    // Override with updated headers with accepted encodings:
    headers
  };
}
