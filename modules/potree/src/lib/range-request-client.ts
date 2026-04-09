// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  TileRangeRequestScheduler,
  type TileRangeRequestSchedulerProps,
  type TileRangeRequestTransportResult
} from '@loaders.gl/loader-utils';

/** Options for the Potree 2 binary range reader. */
export type PotreeRangeReaderOptions = TileRangeRequestSchedulerProps & {
  /** Fetch function used for HTTP requests. */
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
};

/**
 * Reads byte ranges from one of the large Potree v2 binary files.
 */
export class PotreeRangeReader {
  /** Dataset base URL containing `metadata.json`, `hierarchy.bin`, and `octree.bin`. */
  readonly baseUrl: string;
  private readonly fetch: (url: string, options?: RequestInit) => Promise<Response>;
  private readonly scheduler: TileRangeRequestScheduler;

  /** Creates a reader for the binary files in a PotreeConverter 2.x dataset. */
  constructor(baseUrl: string, options: PotreeRangeReaderOptions = {}) {
    this.baseUrl = baseUrl;
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

  /** Schedules a range read against a Potree v2 binary file. */
  async readFileRange(path: string, offset: number, length: number): Promise<ArrayBuffer> {
    const url = `${this.baseUrl}/${path}`;
    return await this.scheduler.scheduleRequest({
      sourceId: url,
      offset,
      length,
      fetchRange: (rangeOffset, rangeLength, signal) =>
        this.fetchRange(url, rangeOffset, rangeLength, signal)
    });
  }

  /** Fetches one HTTP range or slices a full-file fallback response. */
  private async fetchRange(
    url: string,
    offset: number,
    length: number,
    signal?: AbortSignal
  ): Promise<TileRangeRequestTransportResult> {
    const abortContext = createAbortableFetchContext(signal);

    try {
      const response = await this.fetch(url, {
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

/** Cancels a response body when a server ignores a `Range` header and starts sending a whole Potree file. */
async function cancelIgnoredRangeResponse(response: Response): Promise<void> {
  await response.body?.cancel().catch(() => {});
}
