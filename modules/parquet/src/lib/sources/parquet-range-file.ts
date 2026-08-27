// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile, Stat} from '@loaders.gl/loader-utils';
import {RangeRequestCache, RangeRequestScheduler} from '@loaders.gl/loader-utils';

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

type ContentRange = {
  start: number;
  end: number;
  total: number;
};

const DEFAULT_RANGE_CACHE_BYTES = 65536;

/** Strict HTTP range-backed file with Parquet object-version validation. */
export class ParquetRangeFile implements ReadableFile {
  /** URL used as the file handle. */
  readonly handle: string;
  /** URL of the remote Parquet object. */
  readonly url: string;

  /** Fetch implementation inherited from source loader options. */
  private readonly fetch: FetchLike;
  /** Headers inherited from source loader options. */
  private readonly headers?: HeadersInit;
  /** Source telemetry callback invoked after transport and cache operations. */
  private readonly onTelemetry?: (event: ParquetRangeTelemetryEvent) => void;
  /** Scheduler used to coalesce later row-group reads. */
  private readonly scheduler: RangeRequestScheduler;
  /** Aborts all active requests when the file is closed. */
  private readonly closeController = new AbortController();
  /** Bounded cache for repeated metadata and small range reads. */
  private readonly cache: RangeRequestCache;
  /** Remote object byte length discovered from `Content-Range`. */
  private fileByteLength = 0;
  /** Object validators captured by the opening range request. */
  private version: ParquetObjectVersion = {};
  /** Whether `close()` has been called. */
  private closed = false;

  /** Creates an unopened remote Parquet file. Use `open()` before reading it. */
  constructor(url: string, options: ParquetRangeFileOptions) {
    this.handle = url;
    this.url = url;
    this.fetch = options.fetch;
    this.headers = options.headers;
    this.onTelemetry = options.onTelemetry;
    this.cache = new RangeRequestCache({
      maxBytes: DEFAULT_RANGE_CACHE_BYTES,
      onEvent: event => {
        if (event.type === 'hit') {
          this.onTelemetry?.({type: 'cache-hit', cacheHits: 1});
        }
      }
    });
    this.scheduler =
      options.rangeRequests?.scheduler ||
      new RangeRequestScheduler({
        batchDelayMs: options.rangeRequests?.batchDelayMs ?? 0,
        maxGapBytes: options.rangeRequests?.maxGapBytes,
        rangeExpansionBytes: options.rangeRequests?.rangeExpansionBytes,
        maxMergedBytes: options.rangeRequests?.maxMergedBytes,
        stats: options.rangeRequests?.stats,
        onEvent: options.rangeRequests?.onEvent
      });
  }

  /** Total remote object byte length after `open()`. */
  get size(): number {
    return this.fileByteLength;
  }

  /** Total remote object byte length as a bigint after `open()`. */
  get bigsize(): bigint {
    return BigInt(this.fileByteLength);
  }

  /** Immutable copy of the HTTP validators captured when the object was opened. */
  get objectVersion(): ParquetObjectVersion {
    return {...this.version};
  }

  /** Opens the object with a four-byte range probe and caches the Parquet header. */
  async open(signal?: AbortSignal): Promise<this> {
    this.assertOpen();
    const result = await this.fetchExactRange(0, 4, signal, false);
    this.fileByteLength = result.contentRange.total;
    this.version = getObjectVersion(result.response.headers);
    this.cache.set(getVersionedSourceId(this.url, this.version), 0, result.arrayBuffer);
    return this;
  }

  /** Reads an exact byte range without downloading the complete object. */
  async read(
    start: number | bigint = 0,
    length: number = this.size - Number(start),
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    this.assertOpen();
    const offset = Number(start);
    assertValidRange(offset, length, this.size);
    if (length === 0) {
      return new ArrayBuffer(0);
    }

    const abortContext = createCombinedAbortSignal(signal, this.closeController.signal);
    try {
      return await this.cache.read({
        sourceId: getVersionedSourceId(this.url, this.version),
        offset,
        length,
        signal: abortContext.signal,
        fetchRange: async (rangeOffset, rangeLength, cacheSignal) =>
          await this.scheduler.scheduleRequest({
            sourceId: getVersionedSourceId(this.url, this.version),
            offset: rangeOffset,
            length: rangeLength,
            signal: cacheSignal,
            fetchRange: async (transportOffset, transportLength, transportSignal) => {
              const result = await this.fetchExactRange(
                transportOffset,
                transportLength,
                transportSignal,
                true
              );
              return {
                arrayBuffer: result.arrayBuffer,
                status: result.response.status,
                transportBytes: result.arrayBuffer.byteLength
              };
            }
          })
      });
    } finally {
      abortContext.dispose();
    }
  }

  /** Returns file length information without another HTTP request. */
  async stat(): Promise<Stat> {
    this.assertOpen();
    return {size: this.size, bigsize: this.bigsize, isDirectory: false};
  }

  /** Aborts active requests and prevents future reads. */
  async close(): Promise<void> {
    if (!this.closed) {
      this.closed = true;
      this.closeController.abort();
      this.cache.clear();
    }
  }

  /** Fetches and validates one exact HTTP byte range. */
  private async fetchExactRange(
    offset: number,
    length: number,
    signal: AbortSignal | undefined,
    validateVersion: boolean
  ): Promise<{response: Response; arrayBuffer: ArrayBuffer; contentRange: ContentRange}> {
    const abortContext = createCombinedAbortSignal(signal, this.closeController.signal);
    const startTime = getCurrentTime();
    try {
      const response = await this.fetch(this.url, {
        headers: createRangeHeaders(this.headers, offset, length, validateVersion && this.version),
        signal: abortContext.signal
      });

      if (response.status === 412) {
        throw new Error('Parquet object changed while it was being read');
      }
      if (response.status !== 206) {
        await response.body?.cancel().catch(() => {});
        throw new Error(
          `ParquetSource requires HTTP byte ranges (expected 206, received ${response.status})`
        );
      }

      const contentRange = parseContentRange(response.headers.get('Content-Range'));
      if (
        contentRange.start !== offset ||
        contentRange.end !== offset + length - 1 ||
        (this.fileByteLength > 0 && contentRange.total !== this.fileByteLength)
      ) {
        await response.body?.cancel().catch(() => {});
        throw new Error('Parquet range response does not match the requested object range');
      }

      if (validateVersion) {
        assertObjectVersion(this.version, getObjectVersion(response.headers));
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength !== length) {
        throw new Error(
          `Parquet range response returned ${arrayBuffer.byteLength} bytes; expected ${length}`
        );
      }
      this.onTelemetry?.({
        type: 'range-request',
        rangeRequestCount: 1,
        requestedBytes: length,
        downloadedBytes: arrayBuffer.byteLength,
        networkDurationMs: getCurrentTime() - startTime
      });
      return {response, arrayBuffer, contentRange};
    } catch (error) {
      this.onTelemetry?.({
        type: 'range-request',
        rangeRequestCount: 1,
        requestedBytes: length,
        networkDurationMs: getCurrentTime() - startTime,
        failedRangeRequestCount: 1,
        abortedRangeRequestCount:
          abortContext.signal.aborted || isAbortError(error) ? 1 : undefined,
        error
      });
      throw error;
    } finally {
      abortContext.dispose();
    }
  }

  /** Throws when the file has already been closed. */
  private assertOpen(): void {
    if (this.closed) {
      throw new Error('Parquet source is closed');
    }
  }
}

/** Returns a monotonic timestamp when available and falls back to wall-clock time. */
function getCurrentTime(): number {
  return globalThis.performance?.now() ?? Date.now();
}

/** Returns true for DOM and cross-runtime abort errors. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** Validates a requested range against the known object byte length. */
function assertValidRange(offset: number, length: number, fileByteLength: number): void {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0) {
    throw new Error('Parquet byte range must use non-negative safe integers');
  }
  if (offset + length > fileByteLength) {
    throw new Error('Parquet byte range exceeds the object length');
  }
}

/** Creates request headers for one byte range and optional object precondition. */
function createRangeHeaders(
  defaultHeaders: HeadersInit | undefined,
  offset: number,
  length: number,
  version: ParquetObjectVersion | false
): Headers {
  const headers = new Headers(defaultHeaders);
  headers.set('Range', `bytes=${offset}-${offset + length - 1}`);
  if (version && version.etag && !version.etag.startsWith('W/')) {
    headers.set('If-Match', version.etag);
  } else if (version && version.lastModified) {
    headers.set('If-Unmodified-Since', version.lastModified);
  }
  return headers;
}

/** Parses a satisfied single-range `Content-Range` header. */
function parseContentRange(value: string | null): ContentRange {
  const match = value?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
  if (!match) {
    throw new Error(`Invalid Parquet Content-Range header: ${value}`);
  }
  return {start: Number(match[1]), end: Number(match[2]), total: Number(match[3])};
}

/** Reads supported object validators from response headers. */
function getObjectVersion(headers: Headers): ParquetObjectVersion {
  const etag = headers.get('ETag') || undefined;
  const lastModified = headers.get('Last-Modified') || undefined;
  return {etag, lastModified};
}

/** Rejects a response that identifies a different remote object version. */
function assertObjectVersion(expected: ParquetObjectVersion, actual: ParquetObjectVersion): void {
  if (expected.etag && actual.etag && expected.etag !== actual.etag) {
    throw new Error('Parquet object ETag changed while it was being read');
  }
  if (
    !expected.etag &&
    expected.lastModified &&
    actual.lastModified &&
    expected.lastModified !== actual.lastModified
  ) {
    throw new Error('Parquet object Last-Modified changed while it was being read');
  }
}

/** Creates a scheduler identity that isolates object versions. */
function getVersionedSourceId(url: string, version: ParquetObjectVersion): string {
  return `${url}#${version.etag || version.lastModified || 'unversioned'}`;
}

/** Combines two abort signals and returns cleanup for installed listeners. */
function createCombinedAbortSignal(
  firstSignal?: AbortSignal,
  secondSignal?: AbortSignal
): {signal: AbortSignal; dispose: () => void} {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const signals = [firstSignal, secondSignal].filter(Boolean) as AbortSignal[];
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', abort, {once: true});
  }
  return {
    signal: controller.signal,
    dispose: () => {
      for (const signal of signals) {
        signal.removeEventListener('abort', abort);
      }
    }
  };
}
