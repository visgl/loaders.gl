// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  TileRangeRequestScheduler,
  type TileRangeRequestSchedulerProps,
  type TileRangeRequestTransportResult
} from '@loaders.gl/loader-utils';
import type {Getter} from 'copc';

/** Options for the COPC range-request Getter adapter. */
export type RangeRequestGetterOptions = TileRangeRequestSchedulerProps & {
  /** Fetch function used for HTTP requests. */
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
};

/**
 * Creates a COPC getter that reads a URL or Blob through the shared range scheduler.
 */
export function createRangeRequestGetter(
  data: string | Blob,
  options: RangeRequestGetterOptions = {}
): Getter {
  const scheduler = new TileRangeRequestScheduler({
    batchDelayMs: options.batchDelayMs ?? 0,
    maxGapBytes: options.maxGapBytes,
    rangeExpansionBytes: options.rangeExpansionBytes,
    maxMergedBytes: options.maxMergedBytes,
    stats: options.stats,
    onEvent: options.onEvent
  });
  const fetchFunction = options.fetch || fetch;

  return async (begin: number, end: number): Promise<Uint8Array> => {
    if (begin < 0 || end < 0 || begin > end) {
      throw new Error('Invalid COPC byte range');
    }

    const arrayBuffer =
      typeof data === 'string'
        ? await scheduler.scheduleRequest({
            sourceId: data,
            offset: begin,
            length: end - begin,
            fetchRange: (offset, length, signal) =>
              fetchRange(data, offset, length, fetchFunction, signal)
          })
        : await data.slice(begin, end).arrayBuffer();

    return new Uint8Array(arrayBuffer);
  };
}

async function fetchRange(
  url: string,
  offset: number,
  length: number,
  fetchFunction: (url: string, options?: RequestInit) => Promise<Response>,
  signal?: AbortSignal
): Promise<TileRangeRequestTransportResult> {
  const abortContext = createAbortableFetchContext(signal);

  try {
    const response = await fetchFunction(url, {
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

/** Cancels a response body when a server ignores a `Range` header and starts sending the whole point cloud. */
async function cancelIgnoredRangeResponse(response: Response): Promise<void> {
  await response.body?.cancel().catch(() => {});
}
