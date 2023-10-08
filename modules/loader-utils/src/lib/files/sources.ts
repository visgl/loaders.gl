/*
import {fetchFile} from '@loaders.gl/core';

import {Source as PMTilesSource, RangeResponse} from 'pmtiles';

/** @note "source" here is a PMTiles library type, referring to  *
export function makeSource(data: string | Blob, fetch?) {
  if (typeof data === 'string') {
    return new FetchSource(data, fetch);
  }
  if (data instanceof Blob) {
    const url = '';
    return new BlobSource(data, url);
  }
}

export class BlobSource implements PMTilesSource {
  blob: Blob;
  key: string;

  constructor(blob: Blob, key: string) {
    this.blob = blob;
    this.key = key;
  }

  // TODO - how is this used?
  getKey() {
    return this.blob.url || '';
  }

  async getBytes(offset: number, length: number, signal?: AbortSignal): Promise<RangeResponse> {
    const data = await this.blob.arrayBuffer();
    return {
      data
      // etag: response.headers.get('ETag') || undefined,
      // cacheControl: response.headers.get('Cache-Control') || undefined,
      // expires: response.headers.get('Expires') || undefined
    };
  }
}

export class FetchSource implements PMTilesSource {
  url: string;
  fetch;

  constructor(url: string, fetch = fetchFile) {
    this.url = url;
    this.fetch = fetch;
  }

  // TODO - how is this used?
  getKey() {
    return this.url;
  }

  async getBytes(offset: number, length: number, signal?: AbortSignal): Promise<RangeResponse> {
    let controller;
    if (!signal) {
      // ToDO why is it so important to abort in case 200?
      // TODO check this works or assert 206
      controller = new AbortController();
      signal = controller.signal;
    }

    let response = await fetch(this.url, {
      signal,
      headers: {Range: `bytes=${offset}-${offset + length - 1}`}
    });

    switch (response.status) {
      case 206: // Partial Content success
        // This is the expected success code for a range request
        break;

      case 200:
        // some well-behaved backends, e.g. DigitalOcean CDN, respond with 200 instead of 206
        // but we also need to detect no support for Byte Serving which is returning the whole file
        const content_length = response.headers.get('Content-Length');
        if (!content_length || Number(content_length) > length) {
          if (controller) {
            controller.abort();
          }
          throw Error(
            'content-length header missing or exceeding request. Server must support HTTP Byte Serving.'
          );
        }

      case 416: // "Range Not Satisfiable"
        // some HTTP servers don't accept ranges beyond the end of the resource.
        // Retry with the exact length
        // TODO: can return 416 with offset > 0 if content changed, which will have a blank etag.
        // See https://github.com/protomaps/PMTiles/issues/90
        if (offset === 0) {
          const content_range = response.headers.get('Content-Range');
          if (!content_range || !content_range.startsWith('bytes *')) {
            throw Error('Missing content-length on 416 response');
          }
          const actual_length = Number(content_range.substr(8));
          response = await fetch(this.url, {
            signal,
            headers: {Range: `bytes=0-${actual_length - 1}`}
          });
        }
        break;

      default:
        if (response.status >= 300) {
          throw Error(`Bad response code: ${response.status}`);
        }
    }

    const data = await response.arrayBuffer();
    return {
      data,
      etag: response.headers.get('ETag') || undefined,
      cacheControl: response.headers.get('Cache-Control') || undefined,
      expires: response.headers.get('Expires') || undefined
    };
  }
}

/*
class TestNodeFileSource implements Source {
  buffer: ArrayBuffer;
  path: string;
  key: string;
  etag?: string;

  constructor(path: string, key: string) {
    this.path = path;
    this.buffer = fs.readFileSync(path);
    this.key = key;
  }

  getKey() {
    return this.key;
  }

  replaceData(path: string) {
    this.path = path;
    this.buffer = fs.readFileSync(path);
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const slice = new Uint8Array(this.buffer.slice(offset, offset + length))
      .buffer;
    return { data: slice, etag: this.etag };
  }
}
*/
