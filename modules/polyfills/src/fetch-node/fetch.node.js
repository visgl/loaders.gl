import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import Response from './response.node';
import Headers from './headers.node';

import {decodeDataUri} from './utils/decode-data-uri.node';
import {createReadStream} from './utils/stream-utils.node';

const isDataURL = url => url.startsWith('data:');
const isRequestURL = url => url.startsWith('http:') || url.startsWith('https:');

/**
 * Emulation of Browser fetch for Node.js
 * @param url
 * @param options
 */
export default async function fetchNode(url, options) {
  try {
    // Handle data urls in node, to match `fetch``
    // Note - this loses the MIME type, data URIs are handled directly in fetch
    if (isDataURL(url)) {
      const {arrayBuffer, mimeType} = decodeDataUri(url);
      return new Response(arrayBuffer, {
        headers: {'content-type': mimeType}
      });
    }
    // Need to create the stream in advance since Response constructor needs to be sync
    const httpResponseOrStream = await createReadStream(url, options);
    const body = httpResponseOrStream;
    const headers = getHeaders(url, httpResponseOrStream);
    const {status, statusText} = getStatus(httpResponseOrStream);
    return new Response(body, {headers, status, statusText, url});
  } catch (error) {
    // TODO - what error code to use here?
    return new Response(null, {status: 400, statusText: String(error), url});
  }
}

// HELPER FUNCTIONS
// PRIVATE

function getStatus(httpResponse) {
  if (httpResponse.statusCode) {
    return {status: httpResponse.statusCode, statusText: httpResponse.statusMessage || 'NA'};
  }
  return {status: 200, statusText: 'OK'};
}

function getHeaders(url, httpResponse) {
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

  return new Headers(headers);
}

function getContentLength(url) {
  if (isRequestURL(url)) {
    // Needs to be read from actual headers
    return null;
  } else if (isDataURL(url)) {
    // TODO - remove media type etc
    return url.length - 'data:'.length;
  }
  // File URL
  // TODO - how to handle non-existing file, this presumably just throws
  try {
    // strip query params from URL
    const noqueryUrl = url.split('?')[0];
    const stats = fs.statSync(noqueryUrl);
    return stats.size;
  } catch (error) {
    // ignore for now
  }

  return null;
}
