// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  TileRangeRequestScheduler,
  type TileRangeRequestSchedulerProps
} from '@loaders.gl/loader-utils';
import type {Source, RangeResponse} from 'pmtiles';

/** Options for the PMTiles range-request source adapter. */
export type RangeRequestSourceOptions = TileRangeRequestSchedulerProps & {
  /** Fetch function used for PMTiles HTTP requests. */
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
};

/**
 * PMTiles compatible source that reads HTTP byte ranges through a coalescing scheduler.
 */
export class RangeRequestSource implements Source {
  /** URL of the PMTiles archive. */
  readonly url: string;
  private readonly fetch: (url: string, options?: RequestInit) => Promise<Response>;
  private readonly scheduler: TileRangeRequestScheduler;

  /** Creates a PMTiles package Source backed by scheduled HTTP range requests. */
  constructor(url: string, options: RangeRequestSourceOptions = {}) {
    this.url = url;
    this.fetch = options.fetch || fetch;
    this.scheduler = new TileRangeRequestScheduler({
      batchDelayMs: options.batchDelayMs ?? 0,
      maxGapBytes: options.maxGapBytes,
      rangeExpansionBytes: options.rangeExpansionBytes,
      maxMergedBytes: options.maxMergedBytes,
      stats: options.stats,
      onEvent: options.onEvent
    });
  }

  /** Returns the PMTiles source cache key. */
  getKey(): string {
    return this.url;
  }

  /** Reads an exact byte range from the PMTiles archive. */
  async getBytes(offset: number, length: number, signal?: AbortSignal): Promise<RangeResponse> {
    const data = await this.scheduler.scheduleRequest({
      sourceId: this.url,
      offset,
      length,
      signal,
      fetchRange: (rangeOffset, rangeLength, rangeSignal) =>
        this.fetchRange(rangeOffset, rangeLength, rangeSignal)
    });

    return {data};
  }

  /** Issues one transport request for a possibly merged byte range. */
  private async fetchRange(
    offset: number,
    length: number,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const abortContext = createAbortableFetchContext(signal);

    try {
      let response = await this.fetch(this.url, {
        signal: abortContext.signal,
        headers: {Range: `bytes=${offset}-${offset + length - 1}`}
      });

      if (response.status === 416 && offset === 0) {
        const contentRange = response.headers.get('Content-Range');
        if (!contentRange || !contentRange.startsWith('bytes *')) {
          throw new Error('Missing content-length on 416 response');
        }
        const actualLength = Number(contentRange.substring(8));
        response = await this.fetch(this.url, {
          signal: abortContext.signal,
          headers: {Range: `bytes=0-${actualLength - 1}`}
        });
      }

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

/** Cancels a response body when a server ignores a `Range` header and starts sending the whole archive. */
async function cancelIgnoredRangeResponse(response: Response): Promise<void> {
  await response.body?.cancel().catch(() => {});
}
