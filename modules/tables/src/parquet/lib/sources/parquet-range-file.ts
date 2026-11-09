// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile, Stat, HttpFileTelemetry} from '@loaders.gl/core/loader-utils';
import {HttpFile, RangeRequestCache} from '@loaders.gl/core/loader-utils';
import type {ParquetObjectVersion, ParquetRangeRequestOptions} from '../../parquet-source-types';

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

type ParquetRangeFileOptions = {
  /** Fetch implementation used for every HTTP range. */
  fetch: FetchLike;
  /** Headers forwarded to every HTTP range. */
  headers?: HeadersInit;
  /** Range coalescing and diagnostics configuration. */
  rangeRequests?: ParquetRangeRequestOptions;
  /** Receives source-local transport telemetry deltas. */
  onTelemetry?: (event: ParquetRangeTelemetryEvent) => void;
};

type ParquetRangeTelemetryEvent = {
  /** Transport operation that produced this event. */
  type: 'range-request' | 'cache-hit';
  /** Number of transport requests contributed by this event. */
  rangeRequestCount?: number;
  /** Number of transport bytes requested by this event. */
  requestedBytes?: number;
  /** Number of response bytes downloaded by this event. */
  downloadedBytes?: number;
  /** Number of cache hits contributed by this event. */
  cacheHits?: number;
  /** Network duration contributed by this event. */
  networkDurationMs?: number;
  /** Number of failed requests contributed by this event. */
  failedRangeRequestCount?: number;
  /** Number of aborted requests contributed by this event. */
  abortedRangeRequestCount?: number;
  /** Error associated with a failed range request. */
  error?: unknown;
};

/** Cached Parquet file adapter; Core owns HTTP headers, validation and scheduling. */
export class ParquetRangeFile implements ReadableFile {
  /** URL used as the file handle. */
  readonly handle: string;
  /** Remote object URL. */
  readonly url: string;
  /** Core transport, including CORS-hidden Content-Range fallback. */
  private readonly file: HttpFile;
  /** Bounded cache for repeated metadata and small reads. */
  private readonly cache: RangeRequestCache;
  /** Persistent signal aborting both discovery and reads when closed. */
  private readonly closeController = new AbortController();
  /** Source-local telemetry sink. */
  private readonly onTelemetry?: (event: ParquetRangeTelemetryEvent) => void;
  /** Last reported counters, shared across concurrent reads to avoid double counting. */
  private reportedTelemetry: HttpFileTelemetry;
  /** Whether the adapter has been closed. */
  private closed = false;

  /** Creates a lazy file using Core's response-side consistency checks. */
  constructor(url: string, options: ParquetRangeFileOptions) {
    this.handle = url;
    this.url = url;
    this.onTelemetry = options.onTelemetry;
    // Do not add format-specific conditional headers: they can force a failing
    // CORS preflight. HttpFile validates visible response validators and preserves
    // explicit caller headers. Hidden range metadata is handled only in Core.
    this.file = new HttpFile(url, {
      fetch: options.fetch,
      onTelemetry: (counters, error) => this.reportTelemetry(counters, error),
      fetchOptions: {headers: options.headers, signal: this.closeController.signal},
      rangeScheduler: options.rangeRequests?.scheduler,
      rangeSchedulerProps: {
        batchDelayMs: options.rangeRequests?.batchDelayMs ?? 0,
        maxGapBytes: options.rangeRequests?.maxGapBytes,
        rangeExpansionBytes: options.rangeRequests?.rangeExpansionBytes,
        maxMergedBytes: options.rangeRequests?.maxMergedBytes,
        stats: options.rangeRequests?.stats,
        onEvent: options.rangeRequests?.onEvent
      }
    });
    this.reportedTelemetry = this.file.getTelemetry();
    this.cache = new RangeRequestCache({
      maxBytes: 65536,
      onEvent: event => {
        if (event.type === 'hit') this.onTelemetry?.({type: 'cache-hit', cacheHits: 1});
      }
    });
  }

  /** Total remote object size after opening. */
  get size(): number {
    return this.file.size;
  }
  /** Total remote object size as a bigint. */
  get bigsize(): bigint {
    return this.file.bigsize;
  }
  /** Validators pinned by Core during discovery. */
  get objectVersion(): ParquetObjectVersion {
    const identity = this.file.getIdentitySnapshot();
    return {etag: identity?.etag, lastModified: identity?.lastModified};
  }

  /** Pins the object identity with Core's one-byte probe. */
  async open(signal?: AbortSignal): Promise<this> {
    this.assertOpen();
    try {
      await this.file.open(signal);
      // Keep the format header cached for footer/schema readers as before.
      this.cache.set(this.url, 0, await this.file.read(0, 4, signal));
      return this;
    } finally {
      this.reportTelemetry();
    }
  }

  /** Reads through the cache while Core coalesces and validates transport reads. */
  async read(
    start: number | bigint = 0,
    length: number = this.size - Number(start),
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    this.assertOpen();
    const offset = Number(start);
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 0 ||
      offset + length > this.size
    ) {
      throw new Error('Parquet byte range exceeds the object length or is invalid');
    }
    try {
      return await this.cache.read({
        sourceId: this.url,
        offset,
        length,
        signal,
        fetchRange: (rangeOffset, rangeLength, cacheSignal) =>
          this.file.read(rangeOffset, rangeLength, cacheSignal)
      });
    } finally {
      this.reportTelemetry();
    }
  }

  /** Returns pinned file information. */
  async stat(): Promise<Stat> {
    this.assertOpen();
    return this.file.stat();
  }

  /** Aborts active HTTP work and clears cached data. */
  async close(): Promise<void> {
    if (!this.closed) {
      this.closed = true;
      this.closeController.abort();
      this.cache.clear();
      await this.file.close();
    }
  }

  /** Reports cumulative Core counters as non-overlapping source-local deltas. */
  private reportTelemetry(current = this.file.getTelemetry(), error?: unknown): void {
    const previous = this.reportedTelemetry;
    this.reportedTelemetry = current;
    if (
      Object.keys(current).every(
        key => current[key as keyof HttpFileTelemetry] === previous[key as keyof HttpFileTelemetry]
      )
    )
      return;
    this.onTelemetry?.({
      type: 'range-request',
      error,
      rangeRequestCount: current.requestCount - previous.requestCount,
      requestedBytes: current.requestedBytes - previous.requestedBytes,
      downloadedBytes: current.downloadedBytes - previous.downloadedBytes,
      networkDurationMs: current.networkTimeMs - previous.networkTimeMs,
      failedRangeRequestCount:
        current.errorCount + current.abortCount - previous.errorCount - previous.abortCount,
      abortedRangeRequestCount: current.abortCount - previous.abortCount
    });
  }

  /** Rejects operations after close, including cache hits. */
  private assertOpen(): void {
    if (this.closed) throw new Error('Parquet source is closed');
  }
}
