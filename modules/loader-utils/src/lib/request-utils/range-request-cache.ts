// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RequestCache, type RequestCacheRemovalReason} from './request-cache';

/** Event emitted by a {@link RangeRequestCache}. */
export type RangeRequestCacheEvent = {
  /** Cache operation represented by this event. */
  type: 'hit' | 'miss' | 'store' | 'evict';
  /** Stable identifier for the byte-addressable source. */
  sourceId: string;
  /** Requested or stored byte offset. */
  offset: number;
  /** Requested or stored byte length. */
  length: number;
};

/** Options for {@link RangeRequestCache}. */
export type RangeRequestCacheProps = {
  /** Maximum number of settled ranges retained. */
  maxEntries?: number;
  /** Maximum bytes retained across settled ranges. */
  maxBytes?: number;
  /** Called for cache hits, misses, stores, and evictions. */
  onEvent?: (event: RangeRequestCacheEvent) => void;
};

/** One byte-range request handled by {@link RangeRequestCache.read}. */
export type CachedRangeRequest = {
  /** Stable identifier for the byte-addressable source and object version. */
  sourceId: string;
  /** Start byte offset. */
  offset: number;
  /** Number of bytes to read. */
  length: number;
  /** Optional caller cancellation signal. */
  signal?: AbortSignal;
  /** Fetches one exact byte range when it is not cached. */
  fetchRange: (offset: number, length: number, signal: AbortSignal) => Promise<ArrayBuffer>;
};

type CachedRange = {
  sourceId: string;
  offset: number;
  length: number;
  arrayBuffer: ArrayBuffer;
};

/**
 * LRU cache for immutable byte ranges.
 *
 * Exact and contained reads share cached storage while every caller receives a standalone copy.
 * Concurrent exact reads share one abort-aware request. Use a source id that includes an ETag or
 * equivalent version when a URL can change during the cache lifetime.
 */
export class RangeRequestCache {
  private readonly cache: RequestCache<CachedRange>;
  private readonly rangesBySource = new Map<string, Map<string, CachedRange>>();
  private readonly onEvent?: (event: RangeRequestCacheEvent) => void;

  /** Creates a bounded byte-range cache. */
  constructor(props: RangeRequestCacheProps = {}) {
    this.onEvent = props.onEvent;
    this.cache = new RequestCache<CachedRange>({
      maxEntries: props.maxEntries,
      maxBytes: props.maxBytes,
      getByteLength: range => range.length,
      onRemove: (key, reason) => this.handleRemoval(key, reason)
    });
  }

  /** Number of pending and settled ranges tracked by this cache. */
  get size(): number {
    return this.cache.size;
  }

  /** Maximum bytes retained across settled range entries. */
  get maxBytes(): number {
    return this.cache.maxBytes;
  }

  /** Number of byte-range requests that have not settled. */
  get pendingSize(): number {
    return this.cache.pendingSize;
  }

  /** Bytes retained by settled range entries. */
  get byteLength(): number {
    return this.cache.byteLength;
  }

  /** Seeds one completed byte range and copies it into cache-owned storage. */
  set(sourceId: string, offset: number, arrayBuffer: ArrayBuffer): void {
    validateRange(offset, arrayBuffer.byteLength);
    const range: CachedRange = {
      sourceId,
      offset,
      length: arrayBuffer.byteLength,
      arrayBuffer: arrayBuffer.slice(0)
    };
    const key = getRangeKey(sourceId, offset, range.length);
    this.cache.delete(key);
    this.registerRange(key, range);
    this.cache.set(key, range);
    this.onEvent?.({type: 'store', sourceId, offset, length: range.length});
  }

  /** Returns an exact or contained cached range as a standalone buffer. */
  async get(
    sourceId: string,
    offset: number,
    length: number,
    signal?: AbortSignal
  ): Promise<ArrayBuffer | undefined> {
    validateRange(offset, length);
    const match = this.findContainingRange(sourceId, offset, length);
    if (!match) {
      return undefined;
    }
    const range = await this.cache.get(match.key, signal);
    if (!range) {
      return undefined;
    }
    this.onEvent?.({type: 'hit', sourceId, offset, length});
    return sliceRange(range, offset, length);
  }

  /** Returns a cached range or loads and retains one exact range. */
  async read(request: CachedRangeRequest): Promise<ArrayBuffer> {
    const {sourceId, offset, length, signal, fetchRange} = request;
    const cached = await this.get(sourceId, offset, length, signal);
    if (cached) {
      return cached;
    }
    this.onEvent?.({type: 'miss', sourceId, offset, length});
    if (this.cache.maxEntries === 0 || length > this.cache.maxBytes) {
      if (signal?.aborted) {
        throw createAbortError();
      }
      const arrayBuffer = await fetchRange(offset, length, signal || new AbortController().signal);
      validateResponseLength(arrayBuffer, length);
      return arrayBuffer;
    }
    const key = getRangeKey(sourceId, offset, length);
    const placeholder: CachedRange = {
      sourceId,
      offset,
      length,
      arrayBuffer: new ArrayBuffer(0)
    };
    this.registerRange(key, placeholder);
    try {
      const range = await this.cache.getOrLoad(
        key,
        async cacheSignal => {
          const arrayBuffer = await fetchRange(offset, length, cacheSignal);
          validateResponseLength(arrayBuffer, length);
          const loadedRange = {...placeholder, arrayBuffer};
          this.registerRange(key, loadedRange);
          this.onEvent?.({type: 'store', sourceId, offset, length});
          return loadedRange;
        },
        signal
      );
      return sliceRange(range, offset, length);
    } catch (error) {
      if (!this.cache.has(key)) {
        this.unregisterRange(key, sourceId);
      }
      throw error;
    }
  }

  /** Removes every range associated with one source or object version. */
  deleteSource(sourceId: string): void {
    const ranges = this.rangesBySource.get(sourceId);
    if (!ranges) return;
    for (const key of Array.from(ranges.keys())) {
      this.cache.delete(key);
    }
  }

  /** Aborts pending range requests and clears retained bytes. */
  clear(): void {
    this.cache.clear();
    this.rangesBySource.clear();
  }

  private findContainingRange(
    sourceId: string,
    offset: number,
    length: number
  ): {key: string; range: CachedRange} | undefined {
    const ranges = this.rangesBySource.get(sourceId);
    if (!ranges) return undefined;
    const endOffset = offset + length;
    let match: {key: string; range: CachedRange} | undefined;
    for (const [key, range] of ranges) {
      if (
        range.offset <= offset &&
        range.offset + range.length >= endOffset &&
        (!match || range.length < match.range.length)
      ) {
        match = {key, range};
      }
    }
    return match;
  }

  private registerRange(key: string, range: CachedRange): void {
    let ranges = this.rangesBySource.get(range.sourceId);
    if (!ranges) {
      ranges = new Map();
      this.rangesBySource.set(range.sourceId, ranges);
    }
    ranges.set(key, range);
  }

  private handleRemoval(key: string, reason: RequestCacheRemovalReason): void {
    for (const [sourceId, ranges] of this.rangesBySource) {
      const range = ranges.get(key);
      if (!range) continue;
      ranges.delete(key);
      if (ranges.size === 0) {
        this.rangesBySource.delete(sourceId);
      }
      if (reason === 'evict') {
        this.onEvent?.({type: 'evict', sourceId, offset: range.offset, length: range.length});
      }
      return;
    }
  }

  private unregisterRange(key: string, sourceId: string): void {
    const ranges = this.rangesBySource.get(sourceId);
    ranges?.delete(key);
    if (ranges?.size === 0) {
      this.rangesBySource.delete(sourceId);
    }
  }
}

/** Returns a stable exact-range cache key. */
function getRangeKey(sourceId: string, offset: number, length: number): string {
  return `${sourceId}\u0000${offset}:${length}`;
}

/** Copies one requested interval out of a cached containing range. */
function sliceRange(range: CachedRange, offset: number, length: number): ArrayBuffer {
  const relativeOffset = offset - range.offset;
  return range.arrayBuffer.slice(relativeOffset, relativeOffset + length);
}

/** Validates one non-negative safe-integer byte range. */
function validateRange(offset: number, length: number): void {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0) {
    throw new Error('Byte ranges must use non-negative safe integers');
  }
  if (!Number.isSafeInteger(offset + length)) {
    throw new Error('Byte range end must be a safe integer');
  }
}

/** Rejects transport responses that do not exactly cover the requested range. */
function validateResponseLength(arrayBuffer: ArrayBuffer, expectedLength: number): void {
  if (arrayBuffer.byteLength !== expectedLength) {
    throw new Error(
      `Range request returned ${arrayBuffer.byteLength} bytes; expected ${expectedLength}`
    );
  }
}

/** Creates the standard abort error for an already-cancelled uncached range read. */
function createAbortError(): Error {
  const error = new Error('Request aborted');
  error.name = 'AbortError';
  return error;
}
