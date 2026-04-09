// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  TileRangeRequestScheduler,
  type TileRangeRequestSchedulerProps,
  type TileRangeRequestTransportResult
} from '@loaders.gl/loader-utils';

/** Options for the GeoTIFF range-request client. */
export type RangeRequestClientOptions = TileRangeRequestSchedulerProps & {
  /** Fetch function used for GeoTIFF HTTP requests. */
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
};

/** geotiff.js-compatible client that schedules single-range requests. */
export class RangeRequestClient {
  /** URL of the GeoTIFF or OME-TIFF file. */
  readonly url: string;
  private readonly fetch: (url: string, options?: RequestInit) => Promise<Response>;
  private readonly scheduler: TileRangeRequestScheduler;

  /** Creates a range-request client for geotiff.js `fromCustomClient`. */
  constructor(url: string, options: RangeRequestClientOptions = {}) {
    this.url = url;
    this.fetch = options.fetch || fetch;
    this.scheduler = new TileRangeRequestScheduler(options);
  }

  /** Serves geotiff.js requests; single-range requests go through the scheduler. */
  async request({headers, signal}: {headers?: HeadersInit; signal?: AbortSignal} = {}) {
    const rangeHeader = new Headers(headers).get('Range');
    const range = rangeHeader && parseSingleRangeHeader(rangeHeader);

    if (!range) {
      return new FetchResponse(await this.fetch(this.url, {headers, signal}));
    }

    const data = await this.scheduler.scheduleRequest({
      sourceId: this.url,
      offset: range.offset,
      length: range.length,
      signal,
      fetchRange: (offset, length, rangeSignal) => this.fetchRange(offset, length, rangeSignal)
    });

    return new ArrayBufferRangeResponse(data, range.offset);
  }

  /** Fetches one HTTP range or slices a full-file fallback response. */
  private async fetchRange(
    offset: number,
    length: number,
    signal?: AbortSignal
  ): Promise<TileRangeRequestTransportResult> {
    const abortContext = createAbortableFetchContext(signal);

    try {
      const response = await this.fetch(this.url, {
        signal: abortContext.signal,
        headers: {Range: `bytes=${offset}-${offset + length - 1}`}
      });
      if (response.status === 200) {
        abortContext.abort();
        await cancelIgnoredRangeResponse(response);
        throw new Error('Byte-range request failed: server returned 200 instead of 206');
      }

      if (response.status !== 206 && !response.ok) {
        throw new Error(`Bad response code: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return {
        arrayBuffer,
        status: response.status,
        transportBytes: arrayBuffer.byteLength
      };
    } finally {
      abortContext.removeAbortListener();
    }
  }
}

/** Creates an inner abort controller that follows an optional parent signal and can cancel one fetch. */
function createAbortableFetchContext(parentSignal?: AbortSignal): {
  signal: AbortSignal;
  abort: () => void;
  removeAbortListener: () => void;
} {
  const abortController = new AbortController();
  const abortListener = () => abortController.abort();
  if (parentSignal?.aborted) {
    abortController.abort();
  } else {
    parentSignal?.addEventListener('abort', abortListener, {once: true});
  }
  return {
    signal: abortController.signal,
    abort: () => abortController.abort(),
    removeAbortListener: () => parentSignal?.removeEventListener('abort', abortListener)
  };
}

class FetchResponse {
  readonly response: Response;

  /** Wraps a normal fetch Response in the geotiff.js custom-client response interface. */
  constructor(response: Response) {
    this.response = response;
  }

  get status(): number {
    return this.response.status;
  }

  get ok(): boolean {
    return this.response.ok;
  }

  getHeader(name: string): string {
    return this.response.headers.get(name) || '';
  }

  async getData(): Promise<ArrayBuffer> {
    return await this.response.arrayBuffer();
  }
}

class ArrayBufferRangeResponse {
  readonly data: ArrayBuffer;
  readonly offset: number;

  /** Wraps scheduled range bytes in the geotiff.js custom-client response interface. */
  constructor(data: ArrayBuffer, offset: number) {
    this.data = data;
    this.offset = offset;
  }

  get status(): number {
    return 206;
  }

  get ok(): boolean {
    return true;
  }

  getHeader(name: string): string {
    return name.toLowerCase() === 'content-range'
      ? `bytes ${this.offset}-${this.offset + this.data.byteLength}/${this.offset + this.data.byteLength}`
      : '';
  }

  async getData(): Promise<ArrayBuffer> {
    return this.data;
  }
}

/** Cancels a response body when a server ignores a `Range` header and starts sending the whole image. */
async function cancelIgnoredRangeResponse(response: Response): Promise<void> {
  await response.body?.cancel().catch(() => {});
}

/** Parses a `Range` header that asks for exactly one closed byte range. */
function parseSingleRangeHeader(rangeHeader: string): {offset: number; length: number} | null {
  const match = /^bytes=(\d+)-(\d+)$/.exec(rangeHeader);
  if (!match) {
    return null;
  }

  const offset = Number(match[1]);
  const endOffset = Number(match[2]) + 1;
  return {offset, length: endOffset - offset};
}
