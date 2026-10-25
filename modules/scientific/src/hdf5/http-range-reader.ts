// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Strict byte-range transport for backends that can resolve HDF5 chunk addresses. */
export class HTTPRangeReader {
  constructor(
    readonly url: string,
    readonly fetcher: typeof fetch = fetch
  ) {}
  async read(offset: number, length: number, signal?: AbortSignal): Promise<Uint8Array> {
    if (!Number.isSafeInteger(offset) || offset < 0 ||
      !Number.isSafeInteger(length) || length <= 0 ||
      !Number.isSafeInteger(offset + length - 1)) {
      throw new RangeError('HDF5: invalid HTTP byte range');
    }
    const response = await this.fetcher(this.url, {
      headers: {Range: `bytes=${offset}-${offset + length - 1}`},
      signal
    });
    if (response.status !== 206) {
      throw new Error('HDF5: remote server did not honor HTTP Range (206 required)');
    }
    const range = response.headers.get('Content-Range');
    const match = /^bytes (\d+)-(\d+)\/(\d+|\*)$/.exec(range ?? '');
    if (!match || Number(match[1]) !== offset ||
      Number(match[2]) !== offset + length - 1) {
      throw new Error('HDF5: unexpected Content-Range');
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength !== length) throw new Error('HDF5: truncated range response');
    return bytes;
  }
}
