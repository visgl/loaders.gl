// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Reason why an entry was removed from a {@link RequestCache}. */
export type RequestCacheRemovalReason =
  | 'delete'
  | 'evict'
  | 'clear'
  | 'abort'
  | 'error'
  | 'replace';

/** Options for {@link RequestCache}. */
export type RequestCacheProps<Value> = {
  /** Maximum number of settled entries retained. Pending requests are never evicted. */
  maxEntries?: number;
  /** Maximum estimated bytes retained across settled entries. */
  maxBytes?: number;
  /** Returns the estimated byte length of one settled value. */
  getByteLength?: (value: Value) => number;
  /** Called after an entry leaves the cache. */
  onRemove?: (key: string, reason: RequestCacheRemovalReason) => void;
};

type RequestCacheEntry<Value> = {
  promise: Promise<Value>;
  controller?: AbortController;
  pending: boolean;
  waiterCount: number;
  byteLength: number;
};

const DEFAULT_MAX_ENTRIES = Number.POSITIVE_INFINITY;
const DEFAULT_MAX_BYTES = Number.POSITIVE_INFINITY;

/**
 * Source-scoped LRU cache for asynchronous request results.
 *
 * Concurrent callers share one request. Settled entries are retained in least-recently-used order
 * and bounded by both entry count and estimated byte length. Pending entries are protected from LRU
 * eviction; their transport is aborted only after every waiting caller has aborted.
 */
export class RequestCache<Value> {
  /** Maximum number of settled entries retained by this cache. */
  readonly maxEntries: number;
  /** Maximum estimated bytes retained by this cache. */
  readonly maxBytes: number;

  private readonly getByteLength: (value: Value) => number;
  private readonly onRemove?: (key: string, reason: RequestCacheRemovalReason) => void;
  private readonly entries = new Map<string, RequestCacheEntry<Value>>();
  private retainedByteLength = 0;

  /** Creates a request cache with optional entry and byte limits. */
  constructor(props: RequestCacheProps<Value> = {}) {
    this.maxEntries = validateLimit(props.maxEntries, DEFAULT_MAX_ENTRIES, 'maxEntries');
    this.maxBytes = validateLimit(props.maxBytes, DEFAULT_MAX_BYTES, 'maxBytes');
    this.getByteLength = props.getByteLength || (() => 0);
    this.onRemove = props.onRemove;
  }

  /** Number of pending and settled entries currently tracked. */
  get size(): number {
    return this.entries.size;
  }

  /** Number of requests that have not settled. */
  get pendingSize(): number {
    let pendingSize = 0;
    for (const entry of this.entries.values()) {
      pendingSize += entry.pending ? 1 : 0;
    }
    return pendingSize;
  }

  /** Estimated bytes retained by settled entries. */
  get byteLength(): number {
    return this.retainedByteLength;
  }

  /** Returns a cached request and updates its LRU position. */
  get(key: string, signal?: AbortSignal): Promise<Value> | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    this.touch(key, entry);
    return this.waitForEntry(key, entry, signal);
  }

  /** Returns whether a pending or settled entry exists without updating its LRU position. */
  has(key: string): boolean {
    return this.entries.has(key);
  }

  /** Stores an already available value and returns it. */
  set(key: string, value: Value): Value {
    this.removeEntry(key, 'replace');
    const byteLength = getValidByteLength(this.getByteLength(value));
    const entry: RequestCacheEntry<Value> = {
      promise: Promise.resolve(value),
      pending: false,
      waiterCount: 0,
      byteLength
    };
    this.entries.set(key, entry);
    this.retainedByteLength += byteLength;
    this.trim();
    return value;
  }

  /**
   * Returns a cached value or starts one shared request.
   *
   * The loader receives a cache-owned abort signal. One caller aborting only rejects that caller;
   * the shared request is cancelled when no waiters remain.
   */
  getOrLoad(
    key: string,
    load: (signal: AbortSignal) => Promise<Value>,
    signal?: AbortSignal
  ): Promise<Value> {
    const cached = this.get(key, signal);
    if (cached) {
      return cached;
    }
    if (signal?.aborted) {
      return Promise.reject(createAbortError());
    }

    const controller = new AbortController();
    let resolveRequest: (value: Value) => void;
    let rejectRequest: (error: unknown) => void;
    const promise = new Promise<Value>((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    const entry: RequestCacheEntry<Value> = {
      promise,
      controller,
      pending: true,
      waiterCount: 0,
      byteLength: 0
    };
    this.entries.set(key, entry);
    void entry.promise.then(
      value => this.handleLoadedValue(key, entry, value),
      () => this.handleLoadError(key, entry)
    );
    try {
      void Promise.resolve(load(controller.signal)).then(resolveRequest!, rejectRequest!);
    } catch (error) {
      rejectRequest!(error);
    }
    return this.waitForEntry(key, entry, signal);
  }

  /** Removes one cached or pending request. */
  delete(key: string): boolean {
    return this.removeEntry(key, 'delete');
  }

  /** Aborts pending requests and removes every entry. */
  clear(): void {
    for (const key of Array.from(this.entries.keys())) {
      this.removeEntry(key, 'clear');
    }
  }

  private handleLoadedValue(key: string, entry: RequestCacheEntry<Value>, value: Value): void {
    if (this.entries.get(key) !== entry) {
      return;
    }
    entry.pending = false;
    entry.controller = undefined;
    try {
      entry.byteLength = getValidByteLength(this.getByteLength(value));
    } catch {
      this.removeEntry(key, 'error');
      return;
    }
    this.retainedByteLength += entry.byteLength;
    this.trim();
  }

  private handleLoadError(key: string, entry: RequestCacheEntry<Value>): void {
    if (this.entries.get(key) === entry) {
      this.removeEntry(key, entry.controller?.signal.aborted ? 'abort' : 'error');
    }
  }

  private waitForEntry(
    key: string,
    entry: RequestCacheEntry<Value>,
    signal?: AbortSignal
  ): Promise<Value> {
    if (signal?.aborted) {
      return Promise.reject(createAbortError());
    }
    if (!entry.pending) {
      return entry.promise;
    }

    entry.waiterCount++;
    return new Promise<Value>((resolve, reject) => {
      let waiting = true;
      const finishWaiting = (): void => {
        if (!waiting) return;
        waiting = false;
        signal?.removeEventListener('abort', handleAbort);
        entry.waiterCount--;
      };
      const handleAbort = (): void => {
        if (!waiting) return;
        finishWaiting();
        reject(createAbortError());
        if (entry.pending && entry.waiterCount === 0 && this.entries.get(key) === entry) {
          this.removeEntry(key, 'abort');
        }
      };
      signal?.addEventListener('abort', handleAbort, {once: true});
      void entry.promise.then(
        value => {
          if (!waiting) return;
          finishWaiting();
          resolve(value);
        },
        error => {
          if (!waiting) return;
          finishWaiting();
          reject(error);
        }
      );
    });
  }

  private touch(key: string, entry: RequestCacheEntry<Value>): void {
    this.entries.delete(key);
    this.entries.set(key, entry);
  }

  private trim(): void {
    let settledEntryCount = this.entries.size - this.pendingSize;
    if (settledEntryCount <= this.maxEntries && this.retainedByteLength <= this.maxBytes) {
      return;
    }
    for (const [key, entry] of this.entries) {
      if (!entry.pending) {
        this.removeEntry(key, 'evict');
        settledEntryCount--;
      }
      if (settledEntryCount <= this.maxEntries && this.retainedByteLength <= this.maxBytes) {
        break;
      }
    }
  }

  private removeEntry(key: string, reason: RequestCacheRemovalReason): boolean {
    const entry = this.entries.get(key);
    if (!entry) {
      return false;
    }
    this.entries.delete(key);
    this.retainedByteLength -= entry.byteLength;
    if (entry.pending) {
      entry.controller?.abort();
    }
    this.onRemove?.(key, reason);
    return true;
  }
}

/** Creates the standard cross-runtime abort error used by request caches. */
function createAbortError(): Error {
  const error = new Error('Request aborted');
  error.name = 'AbortError';
  return error;
}

/** Validates a non-negative cache limit and applies its default. */
function validateLimit(value: number | undefined, fallback: number, name: string): number {
  const limit = value ?? fallback;
  if (limit < 0 || Number.isNaN(limit)) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return limit;
}

/** Normalizes one user-supplied entry-size estimate. */
function getValidByteLength(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Request cache entry byte length must be a non-negative finite number');
  }
  return value;
}
