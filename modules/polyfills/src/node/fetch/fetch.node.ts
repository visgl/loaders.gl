// loaders.gl, MIT license

import http from 'http';
import https from 'https';
import {Response} from './response.node';
import {Headers} from './headers.node';
import {decodeDataUri} from './utils/decode-data-uri.node';

import {fetchFileNode} from './fetch-file.node';

const isDataURL = (url: string): boolean => url.startsWith('data:');
const isRequestURL = (url: string): boolean => url.startsWith('http:') || url.startsWith('https:');

/**
 * Emulation of Browser fetch for Node.js
 * @param url
 * @param options
 */
export async function fetchNode(url: string, options): Promise<Response> {
  try {
    // Handle file streams in node
    if (!isRequestURL(url) && !isDataURL(url)) {
      return await fetchFileNode(url, options);
    }

    // Handle data urls in node, to match `fetch``
    // Note - this loses the MIME type, data URIs are handled directly in fetch
    if (isDataURL(url)) {
      const {arrayBuffer, mimeType} = decodeDataUri(url);
      const response = new Response(arrayBuffer, {
        headers: {'content-type': mimeType},
        url
      });
      return response;
    }

    // Automatically decompress gzipped files with .gz extension
    const syntheticResponseHeaders = {};
    const originalUrl = url;
    if (url.endsWith('.gz')) {
      url = url.slice(0, -3);
      syntheticResponseHeaders['content-encoding'] = 'gzip';
    }

    // Need to create the stream in advance since Response constructor needs to be sync
    const body = await createHTTPRequestReadStream(originalUrl, options);
    const headers = getHeaders(url, body, syntheticResponseHeaders);
    const {status, statusText} = getStatus(body);

    const followRedirect =
      !options || options.followRedirect || options.followRedirect === undefined;

    if (status >= 300 && status < 400 && headers.has('location') && followRedirect) {
      const redirectUrl = generateRedirectUrl(url, headers.get('location'));

      // Redirect
      return await fetchNode(redirectUrl, options);
    }
    return new Response(body, {headers, status, statusText, url});
  } catch (error) {
    // TODO - what error code to use here?
    return new Response(null, {status: 400, statusText: String(error), url});
  }
}

/** Returns a promise that resolves to a readable stream */
export async function createHTTPRequestReadStream(
  url: string,
  options
): Promise<http.IncomingMessage> {
  // HANDLE HTTP/HTTPS REQUESTS IN NODE
  // TODO: THIS IS BAD SINCE WE RETURN A PROMISE INSTEAD OF A STREAM
  return await new Promise((resolve, reject) => {
    const requestOptions = getRequestOptions(url, options);
    const req = url.startsWith('https:')
      ? https.request(requestOptions, (res) => resolve(res))
      : http.request(requestOptions, (res) => resolve(res));
    req.on('error', (error) => reject(error));
    req.end();
  });
}

/**
 * Generate redirect url from location without origin and protocol.
 * @param originalUrl
 * @param redirectUrl
 */
function generateRedirectUrl(originalUrl: string, location: string): string {
  if (location.startsWith('http')) {
    return location;
  }
  // If url doesn't have origin and protocol just extend current url origin with location.
  const url = new URL(originalUrl);
  url.pathname = location;

  return url.href;
}

// HELPER FUNCTIONS

function getRequestOptions(url: string, options?: {fetch?: typeof fetch; headers?}) {
  // Ensure header keys are lower case so that we can merge without duplicates
  const originalHeaders = options?.headers || {};
  const headers = {};
  for (const key of Object.keys(originalHeaders)) {
    headers[key.toLowerCase()] = originalHeaders[key];
  }

  // Add default accept-encoding to headers
  headers['accept-encoding'] = headers['accept-encoding'] || 'gzip,br,deflate';

  const urlObject = new URL(url);
  return {
    hostname: urlObject.hostname,
    path: urlObject.pathname,
    method: 'GET',
    // Add options and user provided 'options.fetch' overrides if available
    ...options,
    ...options?.fetch,
    // Override with updated headers with accepted encodings:
    headers,
    port: urlObject.port
  };
}

function getStatus(httpResponse: http.IncomingMessage): {status: number; statusText: string} {
  if (httpResponse.statusCode) {
    return {status: httpResponse.statusCode, statusText: httpResponse.statusMessage || 'NA'};
  }
  return {status: 200, statusText: 'OK'};
}

function getHeaders(url, httpResponse, additionalHeaders = {}) {
  const headers = {};

  if (httpResponse && httpResponse.headers) {
    const httpHeaders = httpResponse.headers;
    for (const key in httpHeaders) {
      const header = httpHeaders[key];
      headers[key.toLowerCase()] = String(header);
    }
  }

  // Fix up content length if we can for best progress experience
  if (!headers['content-length']) {
    const contentLength = getContentLength(url);
    if (Number.isFinite(contentLength)) {
      headers['content-length'] = contentLength;
    }
  }

  Object.assign(headers, additionalHeaders);

  return new Headers(headers);
}

/** Needs to be read from actual headers */
function getContentLength(url: string): number | null {
  // TODO - remove media type etc
  return isDataURL(url) ? url.length - 'data:'.length : null;
}
