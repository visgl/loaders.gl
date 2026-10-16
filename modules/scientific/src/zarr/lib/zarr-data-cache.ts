// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/loader-utils';

type CachedData = {
  data: TypedArray;
  shape: number[];
};

const MAX_CACHED_SELECTIONS = 32;
const cacheByArray = new WeakMap<object, Map<string, Promise<CachedData>>>();

/** Reads and caches a decoded Zarr selection, sharing in-flight requests. */
export function getCachedZarrSelection<T extends CachedData>(
  array: object,
  key: string,
  read: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  let cache = cacheByArray.get(array);
  if (!cache) {
    cache = new Map();
    cacheByArray.set(array, cache);
  }

  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return awaitWithAbort(cached as Promise<T>, signal);
  }

  const request = read().catch(error => {
    if (cache?.get(key) === request) {
      cache.delete(key);
    }
    throw error;
  });
  cache.set(key, request);
  while (cache.size > MAX_CACHED_SELECTIONS) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
  return awaitWithAbort(request, signal);
}

/** Returns an independent result so callers cannot mutate the cached buffer. */
export function cloneZarrSelection<T extends CachedData>(selection: T): T {
  return {...selection, data: selection.data.slice() as TypedArray, shape: [...selection.shape]} as T;
}

/** Applies cancellation to one cache waiter without aborting the shared read. */
function awaitWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(signal.reason || new Error('The operation was aborted.'));
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
