// loaders.gl, MIT license

import fs from 'fs';
import {Readable} from 'stream';
import {resolvePath} from '@loaders.gl/loader-utils';
import {decompressReadStream} from './stream-utils.node';

const isBoolean = (x) => typeof x === 'boolean';
const isFunction = (x) => typeof x === 'function';
const isObject = (x) => x !== null && typeof x === 'object';
const isReadableNodeStream = (x) =>
  isObject(x) && isFunction(x.read) && isFunction(x.pipe) && isBoolean(x.readable);

/**
 * Enables
 * @param url
 * @param options
 * @returns
 */
// eslint-disable-next-line max-statements
export async function fetchNode(url: string, options?: RequestInit): Promise<Response> {
  // Support `file://` protocol
  const FILE_PROTOCOL_REGEX = /^file:\/\//;
  url.replace(FILE_PROTOCOL_REGEX, '/');

  // Remove any query parameters, as they have no meaning
  let noqueryUrl = url.split('?')[0];
  noqueryUrl = resolvePath(noqueryUrl);

  const responseHeaders = new Headers();
  // Automatically decompress gzipped files with .gz extension
  if (url.endsWith('.gz')) {
    // url = url.slice(0, -3);
    responseHeaders['content-encoding'] = 'gzip';
  }
  if (url.endsWith('.br')) {
    // url = url.slice(0, -3);
    responseHeaders['content-encoding'] = 'br';
  }

  try {
    // Now open the stream
    const body = await new Promise<fs.ReadStream>((resolve, reject) => {
      // @ts-ignore
      const stream = fs.createReadStream(noqueryUrl, {encoding: null});
      stream.once('readable', () => resolve(stream));
      stream.on('error', (error) => reject(error));
    });

    let bodyStream: Readable = body;

    // Check for content-encoding and create a decompression stream
    if (isReadableNodeStream(body)) {
      bodyStream = decompressReadStream(body, responseHeaders);
    } else if (typeof body === 'string') {
      bodyStream = Readable.from([new TextEncoder().encode(body)]);
    } else {
      bodyStream = Readable.from([body || new ArrayBuffer(0)]);
    }

    const status = 200;
    const statusText = 'OK';
    const headers = getHeadersForFile(noqueryUrl);
    // @ts-expect-error
    const response = new Response(bodyStream, {headers, status, statusText});
    Object.defineProperty(response, 'url', {value: url});
    return response;
  } catch (error) {
    // console.error(error);
    const errorMessage = (error as Error).message;
    const status = 400;
    const statusText = errorMessage;
    const headers = {};
    const response = new Response(errorMessage, {headers, status, statusText});
    Object.defineProperty(response, 'url', {value: url});
    return response;
  }
}

function getHeadersForFile(noqueryUrl: string): Headers {
  const headers = {};

  // Fix up content length if we can for best progress experience
  if (!headers['content-length']) {
    const stats = fs.statSync(noqueryUrl);
    headers['content-length'] = stats.size;
  }

  // Automatically decompress gzipped files with .gz extension
  if (noqueryUrl.endsWith('.gz')) {
    noqueryUrl = noqueryUrl.slice(0, -3);
    headers['content-encoding'] = 'gzip';
  }

  return new Headers(headers);
}
