// loaders.gl, MIT license

import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import {Response} from './response.node';
import {Headers} from './headers.node';

export function isRequestURL(url: string): boolean {
  return url.startsWith('http:') || url.startsWith('https:');
}

export async function fetchFileNode(url: string, options): Promise<Response> {
  const noqueryUrl = url.split('?')[0];

  try {
    // Now open the stream
    const body = await new Promise((resolve, reject) => {
      // @ts-ignore
      const stream = fs.createReadStream(noqueryUrl, {encoding: null});
      stream.once('readable', () => resolve(stream));
      stream.on('error', (error) => reject(error));
    });

    const status = 200;
    const statusText = 'OK';
    const headers = getHeadersForFile(noqueryUrl);
    return new Response(body, {headers, status, statusText, url});
  } catch (error) {
    const status = 400;
    const statusText = (error as Error).message;
    const headers = {};
    return new Response((error as Error).message, {headers, status, statusText, url});
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
