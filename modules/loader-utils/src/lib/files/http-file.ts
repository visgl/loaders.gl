// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ReadableFile, Stat} from './file';

export class HttpFile implements ReadableFile {
  readonly handle: string;
  readonly size: number = 0;
  readonly bigsize: bigint = 0n;
  readonly url: string;

  constructor(url: string) {
    this.handle = url;
    this.url = url;
  }

  async close(): Promise<void> {}

  async stat(): Promise<Stat> {
    const response = await fetch(this.handle, {method: 'HEAD'});
    if (!response.ok) {
      throw new Error(`Failed to fetch HEAD ${this.handle}`);
    }
    const size = parseInt(response.headers.get('Content-Length') || '0');
    return {
      size,
      bigsize: BigInt(size),
      isDirectory: false
    };
  }

  async read(offset: number | bigint = 0, length: number = 0): Promise<ArrayBuffer> {
    const response = await this.fetchRange(offset, length);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }

  /**
   *
   * @param offset
   * @param length
   * @param signal
   * @returns
   * @see https://github.com/protomaps/PMTiles
   */
  // eslint-disable-next-line complexity
  async fetchRange(
    offset: number | bigint,
    length: number,
    signal?: AbortSignal
  ): Promise<Response> {
    const nOffset = Number(offset);
    const nLength = Number(length);

    let controller: AbortController | undefined;
    if (!signal) {
      // ToDO why is it so important to abort in case 200?
      // TODO check this works or assert 206
      controller = new AbortController();
      signal = controller.signal;
    }

    const url = this.handle;
    let response = await fetch(url, {
      signal,
      headers: {Range: `bytes=${nOffset}-${nOffset + nLength - 1}`}
    });

    switch (response.status) {
      case 206: // Partial Content success
        // This is the expected success code for a range request
        break;

      case 200:
        // some well-behaved backends, e.g. DigitalOcean CDN, respond with 200 instead of 206
        // but we also need to detect no support for Byte Serving which is returning the whole file
        const contentLength = response.headers.get('Content-Length');
        if (!contentLength || Number(contentLength) > length) {
          if (controller) {
            controller.abort();
          }
          throw Error(
            'content-length header missing or exceeding request. Server must support HTTP Byte Serving.'
          );
        }

      // @eslint-disable-next-line no-fallthrough
      case 416: // "Range Not Satisfiable"
        // some HTTP servers don't accept ranges beyond the end of the resource.
        // Retry with the exact length
        // TODO: can return 416 with offset > 0 if content changed, which will have a blank etag.
        // See https://github.com/protomaps/PMTiles/issues/90
        if (offset === 0) {
          const contentRange = response.headers.get('Content-Range');
          if (!contentRange || !contentRange.startsWith('bytes *')) {
            throw Error('Missing content-length on 416 response');
          }
          const actualLength = Number(contentRange.substr(8));
          response = await fetch(this.url, {
            signal,
            headers: {Range: `bytes=0-${actualLength - 1}`}
          });
        }
        break;

      default:
        if (response.status >= 300) {
          throw Error(`Bad response code: ${response.status}`);
        }
    }

    return response;
    // const data = await response.arrayBuffer();
    // return {
    //   data,
    //   etag: response.headers.get('ETag') || undefined,
    //   cacheControl: response.headers.get('Cache-Control') || undefined,
    //   expires: response.headers.get('Expires') || undefined
    // };
  }
}
