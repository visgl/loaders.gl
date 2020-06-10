/* global URL */
import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import http from 'http';
import https from 'https';
import zlib from 'zlib';

import decodeDataUri, {toArrayBuffer} from './decode-data-uri.node';
import assert from '../../utils/assert';

const DEFAULT_OPTIONS = {
  dataType: 'arraybuffer'
};

const isDataURL = url => url.startsWith('data:');
const isRequestURL = url => url.startsWith('http:') || url.startsWith('https:');

// Returns a promise that resolves to a readable stream
export async function createReadStream(url, options) {
  // Handle data urls in node, to match `fetch``
  if (isDataURL(url)) {
    // TODO - need to return a stream wrapper
    return decodeDataUri(url);
  }

  // Handle file streams in node
  if (!isRequestURL(url)) {
    // const readFileOptions = getReadFileOptions(options);
    return fs.createReadStream(url, {encoding: null});
  }

  // HANDLE HTTP/HTTPS REQUESTS IN NODE
  // TODO: THIS IS BAD SINCE WE RETURN A PROMISE INSTEAD OF A STREAM
  return await new Promise((resolve, reject) => {
    const requestFunction = url.startsWith('https:') ? https.request : http.request;

    const requestOptions = getRequestOptions(url, options);
    const req = requestFunction(requestOptions, res => resolve(res));
    req.on('error', error => reject(error));
    req.end();
  });
}

export function decompressReadStream(readStream, headers) {
  debugger
  switch (headers.get('content-encoding')) {
    case 'br':
      return readStream.pipe(zlib.createBrotliDecompress());
    case 'gzip':
      return readStream.pipe(zlib.createGunzip());
    case 'deflate':
      return readStream.pipe(zlib.createDeflate());
    default:
      // No compression or an unknown one, just return it as is
      return readStream;
  }
}

export function concatenateReadStream(readStream) {
  let arrayBuffer = new ArrayBuffer(0);

  return new Promise((resolve, reject) => {
    readStream.on('data', chunk => {
      if (typeof chunk === 'string') {
        reject(new Error('Read stream not binary'));
      }
      const chunkAsArrayBuffer = toArrayBuffer(chunk);
      arrayBuffer = concatenateArrayBuffers(arrayBuffer, chunkAsArrayBuffer);
    });

    readStream.on('error', error => reject(error));

    readStream.on('end', () => {
      // TODO verify if this code is still required
      // if (readStream.complete) {
      resolve(arrayBuffer);
      // } else {
      //   reject('The connection was terminated while the message was still being sent');
      // }
    });
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

function concatenateArrayBuffers(source1, source2) {
  const sourceArray1 = source1 instanceof ArrayBuffer ? new Uint8Array(source1) : source1;
  const sourceArray2 = source2 instanceof ArrayBuffer ? new Uint8Array(source2) : source2;
  const temp = new Uint8Array(sourceArray1.byteLength + sourceArray2.byteLength);
  temp.set(sourceArray1, 0);
  temp.set(sourceArray2, sourceArray1.byteLength);
  return temp;
}
