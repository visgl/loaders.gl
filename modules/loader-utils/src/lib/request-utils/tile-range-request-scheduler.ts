// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Stats} from '@probe.gl/stats';

/** Options for the byte-range request scheduler. */
export type TileRangeRequestSchedulerProps = {
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
  onEvent?: (event: TileRangeRequestEvent) => void;
};

export type TileRangeRequest = {
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
  ) => Promise<ArrayBuffer | TileRangeRequestTransportResult>;
};

/** Transport result plus diagnostics for one merged byte-range request. */
export type TileRangeRequestTransportResult = {
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
export type TileRangeRequestEvent = {
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

type PendingRequest = TileRangeRequest & {
  resolve: (arrayBuffer: ArrayBuffer) => void;
  reject: (error: unknown) => void;
};

type MergedRequest = {
  sourceId: string;
  offset: number;
  endOffset: number;
  fetchRange: TileRangeRequest['fetchRange'];
  requests: PendingRequest[];
};

const DEFAULT_PROPS: Required<TileRangeRequestSchedulerProps> = {
  batchDelayMs: 50,
  maxGapBytes: 65536,
  rangeExpansionBytes: 65536,
  maxMergedBytes: 8388608,
  stats: new Stats({id: 'tile-range-request-scheduler-default'}),
  onEvent: () => {}
};

/**
 * Coalesces nearby byte range requests and carves the merged response back
 * into the originally requested byte ranges.
 */
export class TileRangeRequestScheduler {
  /** Runtime scheduler configuration with defaults filled in. */
  readonly props: Required<Omit<TileRangeRequestSchedulerProps, 'stats' | 'onEvent'>>;
  /** Runtime counters for range batching and transport behavior. */
  readonly stats: Stats;
  /** Optional event callback for range batching diagnostics. */
  readonly onEvent?: (event: TileRangeRequestEvent) => void;

  private pendingRequests: PendingRequest[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  /** Creates a scheduler for one group of byte-range-addressable resources. */
  constructor(props: TileRangeRequestSchedulerProps = {}) {
    const rangeExpansionBytes =
      props.rangeExpansionBytes ?? props.maxGapBytes ?? DEFAULT_PROPS.rangeExpansionBytes;
    this.props = {
      batchDelayMs: props.batchDelayMs ?? DEFAULT_PROPS.batchDelayMs,
      maxGapBytes: props.maxGapBytes ?? rangeExpansionBytes,
      rangeExpansionBytes,
      maxMergedBytes: props.maxMergedBytes ?? DEFAULT_PROPS.maxMergedBytes
    };
    this.stats = props.stats || new Stats({id: 'tile-range-request-scheduler'});
    this.onEvent = props.onEvent;
    initializeStats(this.stats);
  }

  /**
   * Enqueues one byte range request and resolves with the exact requested byte slice.
   */
  scheduleRequest(request: TileRangeRequest): Promise<ArrayBuffer> {
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
  private trackEvent(event: TileRangeRequestEvent): void {
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
export function trackStatsEvent(stats: Stats, event: TileRangeRequestEvent): void {
  switch (event.type) {
    case 'queued':
      stats.get('Logical Range Requests', 'count').incrementCount();
      stats.get('Logical Range Request Bytes', 'count').addCount(event.logicalBytes || 0);
      break;
    case 'batch':
      stats.get('Range Request Batches', 'count').incrementCount();
      stats.get('Logical Ranges Batched', 'count').addCount(event.logicalRequestCount || 0);
      stats.get('Transport Ranges Created', 'count').addCount(event.transportRequestCount || 0);
      stats
        .get('Coalesced Logical Ranges', 'count')
        .addCount(
          Math.max((event.logicalRequestCount || 0) - (event.transportRequestCount || 0), 0)
        );
      stats.get('Range Transport Bytes Requested', 'count').addCount(event.transportBytes || 0);
      stats.get('Range Overfetch Bytes', 'count').addCount(event.overfetchBytes || 0);
      break;
    case 'response':
      stats.get('Range Transport Requests Completed', 'count').incrementCount();
      stats.get('Range Response Bytes', 'count').addCount(event.responseBytes || 0);
      if (event.fullResponse) {
        stats.get('Full Response Fallbacks', 'count').incrementCount();
      }
      break;
    case 'error':
      stats.get('Range Transport Requests Failed', 'count').incrementCount();
      break;
    case 'abort':
      stats.get('Aborted Logical Range Requests', 'count').incrementCount();
      break;
    default:
  }
}

/** Returns true when a new request can be folded into an existing merged request. */
function canMergeRequests(
  mergedRequest: MergedRequest,
  request: TileRangeRequest,
  props: Required<Omit<TileRangeRequestSchedulerProps, 'stats' | 'onEvent'>>
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
  stats.get('Logical Range Requests', 'count');
  stats.get('Logical Range Request Bytes', 'count');
  stats.get('Range Request Batches', 'count');
  stats.get('Logical Ranges Batched', 'count');
  stats.get('Transport Ranges Created', 'count');
  stats.get('Coalesced Logical Ranges', 'count');
  stats.get('Range Transport Bytes Requested', 'count');
  stats.get('Range Transport Requests Completed', 'count');
  stats.get('Range Response Bytes', 'count');
  stats.get('Range Overfetch Bytes', 'count');
  stats.get('Full Response Fallbacks', 'count');
  stats.get('Range Transport Requests Failed', 'count');
  stats.get('Aborted Logical Range Requests', 'count');
}

/** Returns the sum of the caller-requested byte lengths. */
function getLogicalRequestBytes(requests: {length: number}[]): number {
  return requests.reduce((sum, request) => sum + request.length, 0);
}

/** Normalizes legacy ArrayBuffer fetch results and diagnostic transport results. */
function normalizeTransportResult(
  result: ArrayBuffer | TileRangeRequestTransportResult
): TileRangeRequestTransportResult {
  return result instanceof ArrayBuffer ? {arrayBuffer: result} : result;
}
