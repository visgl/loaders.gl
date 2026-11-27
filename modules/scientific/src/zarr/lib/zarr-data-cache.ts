// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/core/loader-utils';

/** Decoded data and the shape of a Zarrita selection. */
type CachedData = {
  /** Decoded values. */
  data: TypedArray;
  /** Length of each output dimension. */
  shape: number[];
};

/** One selection in the cache, with bytes accounted for when the read resolves. */
type CacheEntry = {
  /** Shared read result. */
  request: Promise<CachedData>;
  /** Bytes retained by this entry, or zero while pending. */
  byteLength: number;
};

/** Decoded selections owned by one open array. */
type SelectionCache = {
  /** Selections in order from least to most recently used. */
  entries: Map<string, CacheEntry>;
  /** Total bytes retained by settled reads. */
  byteLength: number;
};

/** Maximum number of selections retained per array. A window can span hundreds of chunks. */
const MAX_CACHED_SELECTIONS = 1024;
/** Maximum decoded bytes retained per array. */
const MAX_CACHED_BYTES = 128 * 1024 * 1024;
/** Associates cache lifetime with the open array. */
const cacheByArray = new WeakMap<object, SelectionCache>();

/** Reads and caches a decoded Zarr selection, sharing in-flight requests. */
export function getCachedZarrSelection<T extends CachedData>(
  array: object,
  key: string,
  read: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason || new Error('The operation was aborted.'));
  }
  let cache = cacheByArray.get(array);
  if (!cache) {
    cache = {entries: new Map(), byteLength: 0};
    cacheByArray.set(array, cache);
  }
  const selectionCache = cache;
  const {entries} = selectionCache;

  const cached = entries.get(key);
  if (cached) {
    entries.delete(key);
    entries.set(key, cached);
    return awaitWithAbort(cached.request as Promise<T>, signal);
  }

  const request = read().then(
    result => {
      if (entries.get(key) === entry) {
        const byteLength = result?.data?.byteLength;
        if (byteLength === undefined || byteLength > MAX_CACHED_BYTES) {
          entries.delete(key);
        } else {
          entry.byteLength = byteLength;
          selectionCache.byteLength += byteLength;
          trimCache(selectionCache);
        }
      }
      return result;
    },
    error => {
      if (entries.get(key) === entry) {
        entries.delete(key);
      }
      throw error;
    }
  );
  const entry: CacheEntry = {request, byteLength: 0};
  entries.set(key, entry);
  trimCache(selectionCache);
  return awaitWithAbort(request, signal);
}

/** Evicts the least recently used selections until both budgets are met. */
function trimCache(cache: SelectionCache): void {
  for (const [key, entry] of cache.entries) {
    if (cache.entries.size <= MAX_CACHED_SELECTIONS && cache.byteLength <= MAX_CACHED_BYTES) break;
    cache.entries.delete(key);
    cache.byteLength -= entry.byteLength;
  }
}

/** Returns an independent result so callers cannot mutate the cached buffer. */
export function cloneZarrSelection<T extends CachedData>(selection: T): T {
  return {
    ...selection,
    data: selection.data.slice() as TypedArray,
    shape: [...selection.shape]
  } as T;
}

/** Applies cancellation to one cache waiter without aborting the shared read. */
export function awaitWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted)
    return Promise.reject(signal.reason || new Error('The operation was aborted.'));
  return new Promise<T>((resolve, reject) => {
    const abort = () => {
      cleanup();
      reject(signal.reason || new Error('The operation was aborted.'));
    };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, {once: true});
    promise.then(
      value => {
        cleanup();
        resolve(value);
      },
      error => {
        cleanup();
        reject(error);
      }
    );
  });
}

/** Creates a stable cache key for a Zarrita selection. */
export function getZarrSelectionKey(selection: readonly unknown[]): string {
  return JSON.stringify(selection, (_key, value) =>
    value && typeof value === 'object' && 'start' in value && 'stop' in value && 'step' in value
      ? {start: value.start ?? null, stop: value.stop ?? null, step: value.step ?? null}
      : value
  );
}
