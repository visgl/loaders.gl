// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readRangeResponse} from '@loaders.gl/core/loader-utils';

/** Strict byte-range transport for backends that can resolve HDF5 chunk addresses. */
export class HTTPRangeReader {
  /** Create a strict range reader for one remote HDF5 URL. */
  constructor(
    /** URL of the remote object. */
    readonly url: string,
    /** Fetch implementation used for range requests. */
    readonly fetcher: typeof fetch = fetch
  ) {}
  /** Read exactly one HTTP byte range and validate the response. */
  async read(offset: number, length: number, signal?: AbortSignal): Promise<Uint8Array> {
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(length) ||
      length <= 0 ||
      !Number.isSafeInteger(offset + length - 1)
    ) {
      throw new RangeError('HDF5: invalid HTTP byte range');
    }
    const response = await this.fetcher(this.url, {
      headers: {Range: `bytes=${offset}-${offset + length - 1}`},
      signal
    });
    return readRangeResponse(response, offset, length, signal);
  }
}
