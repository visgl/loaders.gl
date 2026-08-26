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
  read: () => Promise<T>
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
    return cached as Promise<T>;
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
  return request;
}

/** Creates a stable cache key for a Zarrita selection. */
export function getZarrSelectionKey(selection: readonly unknown[]): string {
  return JSON.stringify(selection, (_key, value) =>
    value && typeof value === 'object' && 'start' in value && 'stop' in value && 'step' in value
      ? {start: value.start ?? null, stop: value.stop ?? null, step: value.step ?? null}
      : value
  );
}
