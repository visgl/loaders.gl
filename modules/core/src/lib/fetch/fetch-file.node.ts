// loaders.gl, MIT license

import {fs} from '@loaders.gl/loader-utils';

/**
 * Enables
 * @param url
 * @param options
 * @returns
 */
export async function fetchFileNode(url: string, options): Promise<Response> {
  // Support `file://` protocol
  const FILE_PROTOCOL_REGEX = /^file:\/\//;
  url.replace(FILE_PROTOCOL_REGEX, '/');

  const noqueryUrl = url.split('?')[0];

  try {
    // Now open the stream
    const body = await new Promise<fs.ReadStream>((resolve, reject) => {
      // @ts-ignore
      const stream = fs.createReadStream(noqueryUrl, {encoding: null});
      stream.once('readable', () => resolve(stream));
      stream.on('error', (error) => reject(error));
    });

    const status = 200;
    const statusText = 'OK';
    const headers = getHeadersForFile(noqueryUrl);
    // @ts-expect-error
    const response = new Response(body, {headers, status, statusText});
    Object.defineProperty(response, 'url', {value: url});
    return response;
  } catch (error) {
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
