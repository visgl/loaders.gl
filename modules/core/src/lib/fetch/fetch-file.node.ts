// loaders.gl, MIT license

import fs from 'fs';
import zlib from 'zlib';

export function isRequestURL(url: string): boolean {
  return url.startsWith('http:') || url.startsWith('https:');
}

/**
 * Enables
 * @param url
 * @param options
 * @returns
 */
export async function fetchFileNode(url: string, options): Promise<Response> {
  const noqueryUrl = url.split('?')[0];

  try {
    const headers = getHeadersForFile(noqueryUrl);

    // Now open the stream
    const body = await new Promise<fs.ReadStream>((resolve, reject) => {
      // @ts-ignore
      const readStream = fs.createReadStream(noqueryUrl, {encoding: null});
      const stream = decompressReadStream(readStream, headers);
      stream.once('readable', () => resolve(stream));
      stream.on('error', (error) => reject(error));
    });

    const status = 200;
    const statusText = 'OK';
    // @ts-ignore body
    const response = new Response(body, {headers, status, statusText});
    Object.defineProperty(response, 'url', {value: url});
    return response as unknown as Response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'fetchFileNode';
    const status = 400;
    // This is a controversial choice as the statusText is supposed to be the text version of the status code
    // https://developer.mozilla.org/en-US/docs/Web/API/Response/statusText
    // const statusText = 'Bad request';
    const statusText = errorMessage;
    const headers = {};
    const response = new Response(errorMessage, {headers, status, statusText});
    Object.defineProperty(response, 'url', {value: url});
    return response as unknown as Response;
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

/**
 *
 */
function decompressReadStream(readStream, headers) {
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