// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {defineStoreExtension, type ByteCache} from 'zarrita';

/** Capacity of an encoded chunk cache owned by one source. */
export type ZarrChunkCacheProps = {
  /** Maximum number of retained chunks. Defaults to 256. */
  maxEntries?: number;
  /** Maximum number of retained bytes. Defaults to 64 MiB. */
  maxBytes?: number;
};

/** Final path segment of a v2 or v3 chunk key, including scalar chunks. */
const CHUNK_KEY = /\/(?:c(?:\.\d+)*|\d+(?:\.\d+)*)$/;

/** Retains successful chunk reads in least-recently-used order. */
class ZarrChunkCache implements ByteCache {
  /** Retained chunks in order from least to most recently used. */
  private readonly entries = new Map<string, Uint8Array>();
  /** Number of encoded bytes retained across all entries. */
  private byteLength = 0;
  /** Maximum retained entry count. */
  private readonly maxEntries: number;
  /** Maximum retained byte length. */
  private readonly maxBytes: number;

  /** Creates a byte cache with independent count and byte limits. */
  constructor({maxEntries = 256, maxBytes = 64 * 1024 * 1024}: ZarrChunkCacheProps) {
    if (![maxEntries, maxBytes].every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw new Error('Zarr chunk cache limits must be non-negative safe integers.');
    }
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }

  /** Checks whether a chunk is retained. */
  has(key: string): boolean {
    return this.entries.has(key);
  }

  /** Promotes a hit and copies its bytes for the decoder. */
  get(key: string): Uint8Array | undefined {
    const value = this.entries.get(key);
    if (value) {
      this.entries.delete(key);
      this.entries.set(key, value);
      return new Uint8Array(value);
    }
    return undefined;
  }

  /** Retains an independent copy of a successful chunk read when it fits. */
  set(key: string, value: Uint8Array | undefined): void {
    if (!value || !this.maxEntries || !this.maxBytes || value.byteLength > this.maxBytes) {
      return;
    }
    this.delete(key);
    this.entries.set(key, new Uint8Array(value));
    this.byteLength += value.byteLength;
    for (const oldestKey of this.entries.keys()) {
      if (this.entries.size <= this.maxEntries && this.byteLength <= this.maxBytes) break;
      this.delete(oldestKey);
    }
  }

  /** Removes one retained chunk and subtracts its byte length. */
  private delete(key: string): void {
    const value = this.entries.get(key);
    if (value) {
      this.entries.delete(key);
      this.byteLength -= value.byteLength;
    }
  }
}

/** Caches whole chunk objects by store path. Metadata and range requests go to the inner store. */
export const cacheZarrChunks = defineStoreExtension((store, props: ZarrChunkCacheProps = {}) => {
  const cache = new ZarrChunkCache(props);
  return {
    /** Checks cancellation before a hit and again before retaining a store response. */
    async get(key, options) {
      options?.signal?.throwIfAborted();
      if (!CHUNK_KEY.test(key)) {
        return store.get(key, options);
      }
      const cached = cache.get(key);
      if (cached) {
        return cached;
      }
      const value = await store.get(key, options);
      // A custom store can return bytes after its caller aborts.
      options?.signal?.throwIfAborted();
      cache.set(key, value);
      return value;
    }
  };
});
