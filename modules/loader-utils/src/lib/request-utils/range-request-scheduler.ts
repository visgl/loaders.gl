// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Stats} from '@probe.gl/stats';

/** Typed snapshot of the byte-range scheduler counters stored in a probe.gl `Stats` object. */
export type RangeStats = {
  /** Number of caller-requested byte ranges. */
  logicalRanges: number;
  /** Number of queue flushes that produced at least one transport request. */
  rangeBatches: number;
  /** Number of merged byte ranges requested from the transport. */
  transportRanges: number;
  /** Number of merged byte ranges that completed successfully. */
  completedTransportRanges: number;
  /** Number of logical ranges eliminated by coalescing. */
  coalescedRanges: number;
  /** Number of bytes requested by callers before coalescing. */
  requestedBytes: number;
  /** Number of bytes requested from the transport after coalescing and expansion. */
  transportBytes: number;
  /** Number of bytes read from transport responses. */
  responseBytes: number;
  /** Number of transport-requested bytes that were not part of logical caller requests. */
  overfetchBytes: number;
  /** Number of transport ranges that failed. */
  failedTransportRanges: number;
  /** Number of logical byte ranges aborted before completion. */
  abortedLogicalRanges: number;
  /** Number of transport responses that returned a full-object fallback. */
  fullResponseFallbacks: number;
};

/** Options for the byte-range request scheduler. */
export type RangeRequestSchedulerProps = {
  /** Time to wait for sibling range requests before issuing HTTP requests. */
  batchDelayMs?: number;
  /** Maximum byte gap that can be over-fetched when merging two adjacent requests. */
  maxGapBytes?: number;
  /** Maximum byte gap that can be over-fetched when expanding one range to include the next request. */
  rangeExpansionBytes?: number;
  /** Maximum total byte length of one merged range request. */
  maxMergedBytes?: number;
  /** Optional probe.gl Stats object that receives range batching counters. */
  stats?: Stats;
  /** Optional event callback for range batching diagnostics. */
  onEvent?: (event: RangeRequestEvent) => void;
};

/** One logical byte-range request handled by `RangeRequestScheduler.scheduleRequest()`. */
export type RangeRequest = {
  /** Stable identifier for the remote byte-range-addressable resource. */
  sourceId: string;
  /** Start byte offset. */
  offset: number;
  /** Number of bytes to read. */
  length: number;
  /** Optional caller abort signal. */
  signal?: AbortSignal;
  /** Fetches bytes for this source. */
  fetchRange: (
    offset: number,
    length: number,
    signal?: AbortSignal
  ) => Promise<ArrayBuffer | RangeRequestTransportResult>;
};

/** HTTP byte-range request handled by `RangeRequestScheduler.fetch()`. */
export type RangeFetchRequest = {
  /** URL of the remote byte-range-addressable resource. */
  url: string;
  /** Optional stable identifier for the remote resource; defaults to `url`. */
  sourceId?: string;
  /** Start byte offset. */
  offset: number;
  /** Number of bytes to read. */
  length: number;
  /** Optional caller abort signal. */
  signal?: AbortSignal;
  /** Optional fetch implementation for tests or host environments. */
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
  /** Optional fetch options merged into the transport request. */
  fetchOptions?: RequestInit;
};

/** Transport result plus diagnostics for one merged byte-range request. */
export type RangeRequestTransportResult = {
  /** Bytes returned by the transport. */
  arrayBuffer: ArrayBuffer;
  /** HTTP status code or transport-specific equivalent. */
  status?: number;
  /** Number of response bytes read from the transport before slicing. */
  transportBytes?: number;
  /** True when the transport returned the complete object and the requested range was sliced locally. */
  fullResponse?: boolean;
};

/** Diagnostic event emitted by the byte-range request scheduler. */
export type RangeRequestEvent = {
  /** Event type. */
  type: 'queued' | 'batch' | 'request' | 'response' | 'error' | 'abort';
  /** Stable identifier for the remote byte-range-addressable resource. */
  sourceId?: string;
  /** Start byte offset of a merged transport request. */
  offset?: number;
  /** Byte length of a merged transport request. */
  length?: number;
  /** Number of caller requests in a batch or merged request. */
  logicalRequestCount?: number;
  /** Number of merged transport requests created for a batch. */
  transportRequestCount?: number;
  /** Sum of caller-requested bytes. */
  logicalBytes?: number;
  /** Bytes requested from the transport after merging and expansion. */
  transportBytes?: number;
  /** Bytes returned by the transport before slicing. */
  responseBytes?: number;
  /** Bytes fetched only to bridge nearby requested ranges. */
  overfetchBytes?: number;
  /** HTTP status code or transport-specific equivalent. */
  status?: number;
  /** True when the transport returned the complete object and a requested range was sliced locally. */
  fullResponse?: boolean;
  /** Error thrown by one merged transport request. */
  error?: unknown;
};

type PendingRequest = RangeRequest & {
  resolve: (arrayBuffer: ArrayBuffer) => void;
  reject: (error: unknown) => void;
};

type MergedRequest = {
  sourceId: string;
  offset: number;
  endOffset: number;
  fetchRange: RangeRequest['fetchRange'];
  requests: PendingRequest[];
};

/** probe.gl `Stats` counter names used for typed range scheduler snapshots. */
const RANGE_STATS_KEYS: Record<keyof RangeStats, string> = {
  logicalRanges: 'Logical Range Requests',
  rangeBatches: 'Range Request Batches',
  transportRanges: 'Transport Ranges Created',
  completedTransportRanges: 'Range Transport Requests Completed',
  coalescedRanges: 'Coalesced Logical Ranges',
  requestedBytes: 'Logical Range Request Bytes',
  transportBytes: 'Range Transport Bytes Requested',
  responseBytes: 'Range Response Bytes',
  overfetchBytes: 'Range Overfetch Bytes',
  failedTransportRanges: 'Range Transport Requests Failed',
  abortedLogicalRanges: 'Aborted Logical Range Requests',
  fullResponseFallbacks: 'Full Response Fallbacks'
};

const DEFAULT_PROPS: Required<RangeRequestSchedulerProps> = {
  batchDelayMs: 50,
  maxGapBytes: 65536,
  rangeExpansionBytes: 65536,
  maxMergedBytes: 8388608,
  stats: createRangeStats('range-request-scheduler-default'),
  onEvent: () => {}
};

/**
 * Coalesces nearby byte range requests and carves the merged response back
 * into the originally requested byte ranges.
 */
export class RangeRequestScheduler {
  /** Runtime scheduler configuration with defaults filled in. */
  readonly props: Required<Omit<RangeRequestSchedulerProps, 'stats' | 'onEvent'>>;
  /** Runtime counters for range batching and transport behavior. */
  readonly stats: Stats;
  /** Optional event callback for range batching diagnostics. */
  readonly onEvent?: (event: RangeRequestEvent) => void;

  private pendingRequests: PendingRequest[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  /** Creates a scheduler for one group of byte-range-addressable resources. */
  constructor(props: RangeRequestSchedulerProps = {}) {
    const rangeExpansionBytes =
      props.rangeExpansionBytes ?? props.maxGapBytes ?? DEFAULT_PROPS.rangeExpansionBytes;
    this.props = {
      batchDelayMs: props.batchDelayMs ?? DEFAULT_PROPS.batchDelayMs,
      maxGapBytes: props.maxGapBytes ?? rangeExpansionBytes,
      rangeExpansionBytes,
      maxMergedBytes: props.maxMergedBytes ?? DEFAULT_PROPS.maxMergedBytes
    };
    this.stats = props.stats || createRangeStats('range-request-scheduler');
    this.onEvent = props.onEvent;
    initializeStats(this.stats);
  }

  /**
   * Enqueues one byte range request and resolves with the exact requested byte slice.
   */
  scheduleRequest(request: RangeRequest): Promise<ArrayBuffer> {
    if (request.length < 0) {
      return Promise.reject(new Error('Byte range length cannot be negative'));
    }

    if (request.signal?.aborted) {
      return Promise.reject(new Error('Request aborted'));
    }

    const promise = new Promise<ArrayBuffer>((resolve, reject) => {
      this.pendingRequests.push({...request, resolve, reject});
    });

    this.trackEvent({
      type: 'queued',
      sourceId: request.sourceId,
      offset: request.offset,
      length: request.length,
      logicalRequestCount: 1,
      logicalBytes: request.length
    });

    this.scheduleFlush();
    return promise;
  }

  /**
   * Enqueues one HTTP byte-range request and resolves with the exact requested byte slice.
   */
  fetch(request: RangeFetchRequest): Promise<ArrayBuffer> {
    const fetchFunction = request.fetch || globalThis.fetch;
    return this.scheduleRequest({
      sourceId: request.sourceId || request.url,
      offset: request.offset,
      length: request.length,
      signal: request.signal,
      fetchRange: (offset, length, signal) =>
        fetchHttpRange({
          url: request.url,
          offset,
          length,
          signal,
          fetch: fetchFunction,
          fetchOptions: request.fetchOptions
        })
    });
  }

  /** Immediately starts loading the currently queued requests. */
  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const pendingRequests = this.pendingRequests;
    this.pendingRequests = [];

    const activeRequests = pendingRequests.filter(request => {
      if (request.signal?.aborted) {
        request.reject(new Error('Request aborted'));
        this.trackEvent({
          type: 'abort',
          sourceId: request.sourceId,
          offset: request.offset,
          length: request.length,
          logicalRequestCount: 1,
          logicalBytes: request.length
        });
        return false;
      }
      return true;
    });

    const mergedRequests = this.mergeRequests(activeRequests);
    if (activeRequests.length > 0) {
      this.trackBatch(activeRequests, mergedRequests);
    }
    for (const mergedRequest of mergedRequests) {
      this.fetchMergedRequest(mergedRequest); // eslint-disable-line @typescript-eslint/no-floating-promises
    }
  }

  /** Schedules the next pending-request flush. */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => this.flush(), this.props.batchDelayMs);
  }

  /** Sorts active requests and combines requests for the same source when thresholds allow. */
  private mergeRequests(requests: PendingRequest[]): MergedRequest[] {
    requests.sort((left, right) => {
      if (left.sourceId !== right.sourceId) {
        return left.sourceId < right.sourceId ? -1 : 1;
      }
      return left.offset - right.offset;
    });

    const mergedRequests: MergedRequest[] = [];

    for (const request of requests) {
      const requestEndOffset = request.offset + request.length;
      const lastMergedRequest = mergedRequests[mergedRequests.length - 1];

      if (lastMergedRequest && canMergeRequests(lastMergedRequest, request, this.props)) {
        lastMergedRequest.endOffset = Math.max(lastMergedRequest.endOffset, requestEndOffset);
        lastMergedRequest.requests.push(request);
      } else {
        mergedRequests.push({
          sourceId: request.sourceId,
          offset: request.offset,
          endOffset: requestEndOffset,
          fetchRange: request.fetchRange,
          requests: [request]
        });
      }
    }

    return mergedRequests;
  }

  /** Loads one merged range and resolves each child request with its sliced bytes. */
  private async fetchMergedRequest(mergedRequest: MergedRequest): Promise<void> {
    const {offset, endOffset, fetchRange, requests} = mergedRequest;
    const abortController = new AbortController();
    const abortListener = () => {
      if (requests.every(request => request.signal?.aborted)) {
        abortController.abort();
      }
    };

    try {
      for (const request of requests) {
        request.signal?.addEventListener('abort', abortListener, {once: true});
      }

      const logicalBytes = getLogicalRequestBytes(requests);
      const length = endOffset - offset;
      this.trackEvent({
        type: 'request',
        sourceId: mergedRequest.sourceId,
        offset,
        length,
        logicalRequestCount: requests.length,
        logicalBytes,
        transportBytes: length,
        overfetchBytes: Math.max(length - logicalBytes, 0)
      });

      const transportResult = normalizeTransportResult(
        await fetchRange(offset, length, abortController.signal)
      );
      const {arrayBuffer} = transportResult;

      this.trackEvent({
        type: 'response',
        sourceId: mergedRequest.sourceId,
        offset,
        length,
        logicalRequestCount: requests.length,
        logicalBytes,
        transportBytes: length,
        responseBytes: transportResult.transportBytes ?? arrayBuffer.byteLength,
        overfetchBytes: Math.max(length - logicalBytes, 0),
        status: transportResult.status,
        fullResponse: transportResult.fullResponse
      });

      for (const request of requests) {
        if (request.signal?.aborted) {
          request.reject(new Error('Request aborted'));
          this.trackEvent({
            type: 'abort',
            sourceId: request.sourceId,
            offset: request.offset,
            length: request.length,
            logicalRequestCount: 1,
            logicalBytes: request.length
          });
          continue;
        }

        const start = request.offset - offset;
        request.resolve(arrayBuffer.slice(start, start + request.length));
      }
    } catch (error) {
      this.trackEvent({
        type: 'error',
        sourceId: mergedRequest.sourceId,
        offset,
        length: endOffset - offset,
        logicalRequestCount: requests.length,
        logicalBytes: getLogicalRequestBytes(requests),
        error
      });

      for (const request of requests) {
        request.reject(error);
      }
    } finally {
      for (const request of requests) {
        request.signal?.removeEventListener('abort', abortListener);
      }
    }
  }

  /** Emits one event to Stats and to the optional callback. */
  private trackEvent(event: RangeRequestEvent): void {
    trackStatsEvent(this.stats, event);
    this.onEvent?.(event);
  }

  /** Emits one batch event after logical requests have been merged. */
  private trackBatch(activeRequests: PendingRequest[], mergedRequests: MergedRequest[]): void {
    const logicalBytes = getLogicalRequestBytes(activeRequests);
    const transportBytes = mergedRequests.reduce(
      (sum, mergedRequest) => sum + mergedRequest.endOffset - mergedRequest.offset,
      0
    );
    this.trackEvent({
      type: 'batch',
      logicalRequestCount: activeRequests.length,
      transportRequestCount: mergedRequests.length,
      logicalBytes,
      transportBytes,
      overfetchBytes: Math.max(transportBytes - logicalBytes, 0)
    });
  }
}

/**
 * Tracks range batching events in a probe.gl Stats object.
 */
export function trackStatsEvent(stats: Stats, event: RangeRequestEvent): void {
  switch (event.type) {
    case 'queued':
      stats.get(RANGE_STATS_KEYS.logicalRanges, 'count').incrementCount();
      stats.get(RANGE_STATS_KEYS.requestedBytes, 'count').addCount(event.logicalBytes || 0);
      break;
    case 'batch':
      stats.get(RANGE_STATS_KEYS.rangeBatches, 'count').incrementCount();
      stats.get('Logical Ranges Batched', 'count').addCount(event.logicalRequestCount || 0);
      stats
        .get(RANGE_STATS_KEYS.transportRanges, 'count')
        .addCount(event.transportRequestCount || 0);
      stats
        .get(RANGE_STATS_KEYS.coalescedRanges, 'count')
        .addCount(
          Math.max((event.logicalRequestCount || 0) - (event.transportRequestCount || 0), 0)
        );
      stats.get(RANGE_STATS_KEYS.transportBytes, 'count').addCount(event.transportBytes || 0);
      stats.get(RANGE_STATS_KEYS.overfetchBytes, 'count').addCount(event.overfetchBytes || 0);
      break;
    case 'response':
      stats.get(RANGE_STATS_KEYS.completedTransportRanges, 'count').incrementCount();
      stats.get(RANGE_STATS_KEYS.responseBytes, 'count').addCount(event.responseBytes || 0);
      if (event.fullResponse) {
        stats.get(RANGE_STATS_KEYS.fullResponseFallbacks, 'count').incrementCount();
      }
      break;
    case 'error':
      stats.get(RANGE_STATS_KEYS.failedTransportRanges, 'count').incrementCount();
      break;
    case 'abort':
      stats.get(RANGE_STATS_KEYS.abortedLogicalRanges, 'count').incrementCount();
      break;
    default:
  }
}

/** Creates a probe.gl `Stats` object initialized with byte-range scheduler counters. */
export function createRangeStats(id = 'range-request-scheduler'): Stats {
  const stats = new Stats({id});
  initializeStats(stats);
  return stats;
}

/** Reads byte-range scheduler counters from a probe.gl `Stats` object. */
export function getRangeStats(stats: Stats): RangeStats {
  return {
    logicalRanges: stats.get(RANGE_STATS_KEYS.logicalRanges).count,
    rangeBatches: stats.get(RANGE_STATS_KEYS.rangeBatches).count,
    transportRanges: stats.get(RANGE_STATS_KEYS.transportRanges).count,
    completedTransportRanges: stats.get(RANGE_STATS_KEYS.completedTransportRanges).count,
    coalescedRanges: stats.get(RANGE_STATS_KEYS.coalescedRanges).count,
    requestedBytes: stats.get(RANGE_STATS_KEYS.requestedBytes).count,
    transportBytes: stats.get(RANGE_STATS_KEYS.transportBytes).count,
    responseBytes: stats.get(RANGE_STATS_KEYS.responseBytes).count,
    overfetchBytes: stats.get(RANGE_STATS_KEYS.overfetchBytes).count,
    failedTransportRanges: stats.get(RANGE_STATS_KEYS.failedTransportRanges).count,
    abortedLogicalRanges: stats.get(RANGE_STATS_KEYS.abortedLogicalRanges).count,
    fullResponseFallbacks: stats.get(RANGE_STATS_KEYS.fullResponseFallbacks).count
  };
}

/** Issues one HTTP range request and parses range-related status/header behavior. */
export async function fetchHttpRange(
  request: Required<Pick<RangeFetchRequest, 'url' | 'fetch'>> &
    Pick<RangeFetchRequest, 'offset' | 'length' | 'signal' | 'fetchOptions'>
): Promise<RangeRequestTransportResult> {
  const abortContext = createAbortableFetchContext(request.signal);

  try {
    let response = await request.fetch(
      request.url,
      createRangeFetchOptions(
        request.fetchOptions,
        request.offset,
        request.length,
        abortContext.signal
      )
    );

    if (response.status === 416 && request.offset === 0) {
      const actualLength = parseUnsatisfiedContentRange(response.headers.get('Content-Range'));
      if (!actualLength) {
        throw new Error('Missing content-length on 416 response');
      }
      response = await request.fetch(
        request.url,
        createRangeFetchOptions(request.fetchOptions, 0, actualLength, abortContext.signal)
      );
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

/** Returns true when a new request can be folded into an existing merged request. */
function canMergeRequests(
  mergedRequest: MergedRequest,
  request: RangeRequest,
  props: Required<Omit<RangeRequestSchedulerProps, 'stats' | 'onEvent'>>
): boolean {
  if (mergedRequest.sourceId !== request.sourceId) {
    return false;
  }

  const requestEndOffset = request.offset + request.length;
  const gapBytes = request.offset - mergedRequest.endOffset;
  const mergedBytes = Math.max(mergedRequest.endOffset, requestEndOffset) - mergedRequest.offset;

  return gapBytes <= props.rangeExpansionBytes && mergedBytes <= props.maxMergedBytes;
}

/** Initializes the Stats keys used by the range scheduler. */
function initializeStats(stats: Stats): void {
  stats.get(RANGE_STATS_KEYS.logicalRanges, 'count');
  stats.get(RANGE_STATS_KEYS.requestedBytes, 'count');
  stats.get(RANGE_STATS_KEYS.rangeBatches, 'count');
  stats.get('Logical Ranges Batched', 'count');
  stats.get(RANGE_STATS_KEYS.transportRanges, 'count');
  stats.get(RANGE_STATS_KEYS.coalescedRanges, 'count');
  stats.get(RANGE_STATS_KEYS.transportBytes, 'count');
  stats.get(RANGE_STATS_KEYS.completedTransportRanges, 'count');
  stats.get(RANGE_STATS_KEYS.responseBytes, 'count');
  stats.get(RANGE_STATS_KEYS.overfetchBytes, 'count');
  stats.get(RANGE_STATS_KEYS.fullResponseFallbacks, 'count');
  stats.get(RANGE_STATS_KEYS.failedTransportRanges, 'count');
  stats.get(RANGE_STATS_KEYS.abortedLogicalRanges, 'count');
}

/** Returns the sum of the caller-requested byte lengths. */
function getLogicalRequestBytes(requests: {length: number}[]): number {
  return requests.reduce((sum, request) => sum + request.length, 0);
}

/** Normalizes legacy ArrayBuffer fetch results and diagnostic transport results. */
function normalizeTransportResult(
  result: ArrayBuffer | RangeRequestTransportResult
): RangeRequestTransportResult {
  return result instanceof ArrayBuffer ? {arrayBuffer: result} : result;
}

/** Creates fetch options for one HTTP byte-range request while preserving caller headers. */
function createRangeFetchOptions(
  fetchOptions: RequestInit | undefined,
  offset: number,
  length: number,
  signal: AbortSignal
): RequestInit {
  return {
    ...fetchOptions,
    signal,
    headers: {
      ...getHeadersObject(fetchOptions?.headers),
      Range: `bytes=${offset}-${offset + length - 1}`
    }
  };
}

/** Copies supported HeadersInit values into a plain object so Range can be merged in. */
function getHeadersObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
}

/** Parses a `Content-Range: bytes *\/<length>` header from an unsatisfied range response. */
function parseUnsatisfiedContentRange(contentRange: string | null): number | null {
  const match = contentRange?.match(/^bytes \*\/(\d+)$/);
  return match ? Number(match[1]) : null;
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
