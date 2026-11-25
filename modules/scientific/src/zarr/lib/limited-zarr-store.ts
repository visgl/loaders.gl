// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AsyncReadable, FetchStore} from 'zarrita';

/** Limits overlapping Zarrita reads, including range reads and response body consumption. */
export function limitZarrStore(store: FetchStore, limit: number): AsyncReadable {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('GeoZarr maxConcurrentRequests must be a positive integer.');
  }

  let active = 0;
  const waiting: Array<() => void> = [];

  /** Waits in FIFO order and leaves the queue as soon as the caller aborts. */
  function waitForSlot(signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const onSlot = () => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      };
      const onAbort = () => {
        const index = waiting.indexOf(onSlot);
        if (index >= 0) {
          waiting.splice(index, 1);
        }
        reject(signal?.reason);
      };
      waiting.push(onSlot);
      signal?.addEventListener('abort', onAbort, {once: true});
    });
  }

  /** Holds one slot until the underlying store has finished reading bytes. */
  async function read(
    request: () => Promise<Uint8Array | undefined>,
    signal?: AbortSignal
  ): Promise<Uint8Array | undefined> {
    signal?.throwIfAborted();
    if (active < limit) {
      active++;
    } else {
      await waitForSlot(signal);
    }
    try {
      signal?.throwIfAborted();
      return await request();
    } finally {
      const next = waiting.shift();
      if (next) {
        next();
      } else {
        active--;
      }
    }
  }

  return {
    get: (key, options) => read(() => store.get(key, options), options?.signal),
    getRange: (key, range, options) =>
      read(() => store.getRange(key, range, options), options?.signal)
  };
}
