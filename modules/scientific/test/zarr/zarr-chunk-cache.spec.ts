// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {AsyncReadable} from 'zarrita';
import {limitZarrStore} from '../../src/zarr/lib/limited-zarr-store';
import {cacheZarrChunks} from '../../src/zarr/lib/zarr-chunk-cache';

test.each([
  {maxBytes: 4, maxEntries: 8},
  {maxBytes: 16, maxEntries: 2}
])('encoded chunks are evicted in LRU order with limits $maxBytes bytes and $maxEntries entries', async limits => {
  const get = vi.fn<AsyncReadable['get']>().mockImplementation(async () => new Uint8Array([1, 2]));
  const store = cacheZarrChunks({get}, limits);
  const bytes = await store.get('/raster/0.0');
  bytes?.fill(5);
  await store.get('/raster/1.0');
  const cached = await store.get('/raster/0.0');
  expect(cached).toEqual(new Uint8Array([1, 2]));
  cached?.fill(6);
  await store.get('/raster/2.0');
  expect(await store.get('/raster/0.0')).toEqual(new Uint8Array([1, 2]));
  await store.get('/raster/1.0');
  expect(get.mock.calls.map(([path]) => path)).toEqual([
    '/raster/0.0',
    '/raster/1.0',
    '/raster/2.0',
    '/raster/1.0'
  ]);
});

test('oversized and absent chunks leave existing encoded cache entries intact', async () => {
  const get = vi
    .fn<AsyncReadable['get']>()
    .mockResolvedValueOnce(new Uint8Array([1]))
    .mockResolvedValueOnce(new Uint8Array([2, 3]))
    .mockResolvedValueOnce(new Uint8Array([2, 3]))
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(new Uint8Array([4]));
  const store = cacheZarrChunks({get}, {maxBytes: 1});
  await store.get('/raster/c/0/0');
  await store.get('/raster/c/0/1');
  await store.get('/raster/c/0/1');
  expect(await store.get('/raster/c/0/0')).toEqual(new Uint8Array([1]));
  await expect(store.get('/raster/c/0/2')).resolves.toBeUndefined();
  await expect(store.get('/raster/c/0/2')).resolves.toEqual(new Uint8Array([4]));
  expect(get).toHaveBeenCalledTimes(5);
});

test('metadata and range reads bypass the encoded chunk cache', async () => {
  const get = vi.fn<AsyncReadable['get']>().mockResolvedValue(new Uint8Array([1, 2]));
  const getRange = vi
    .fn<NonNullable<AsyncReadable['getRange']>>()
    .mockResolvedValueOnce(new Uint8Array([3]))
    .mockResolvedValueOnce(new Uint8Array([4]));
  const store = cacheZarrChunks({get, getRange});
  for (const path of [
    '/raster/zarr.json',
    '/raster/.zarray',
    '/raster/.zattrs',
    '/.zgroup',
    '/.zmetadata',
    '/zmetadata'
  ] as const) {
    await store.get(path);
    await store.get(path);
  }
  expect(get).toHaveBeenCalledTimes(12);

  const path = '/raster/c.0.0';
  const range = {offset: 0, length: 1};
  await store.get(path);
  await expect(store.getRange(path, range)).resolves.toEqual(new Uint8Array([3]));
  await expect(store.getRange(path, range)).resolves.toEqual(new Uint8Array([4]));
  await expect(store.get(path)).resolves.toEqual(new Uint8Array([1, 2]));
  expect(getRange).toHaveBeenCalledTimes(2);
  expect(get).toHaveBeenCalledTimes(13);
});

test.each([
  true,
  false
])('an aborted encoded read is retryable when the store honors abort: %s', async honorsAbort => {
  const controller = new AbortController();
  const reason = new DOMException('Read cancelled', 'AbortError');
  const get = vi
    .fn<AsyncReadable['get']>()
    .mockImplementationOnce(async (_path, options) => {
      controller.abort(reason);
      if (honorsAbort) options?.signal?.throwIfAborted();
      return new Uint8Array([1]);
    })
    .mockResolvedValueOnce(new Uint8Array([2]));
  const store = cacheZarrChunks({get});
  const path = '/raster/0.0';
  await expect(store.get(path, {signal: controller.signal})).rejects.toBe(reason);
  await expect(store.get(path)).resolves.toEqual(new Uint8Array([2]));
  await expect(store.get(path, {signal: controller.signal})).rejects.toBe(reason);
  await expect(store.get(path)).resolves.toEqual(new Uint8Array([2]));
  expect(get).toHaveBeenCalledTimes(2);
});

test('encoded hits bypass an occupied request limiter slot', async () => {
  const pending = Promise.withResolvers<Uint8Array>();
  const get = vi
    .fn<AsyncReadable['get']>()
    .mockResolvedValueOnce(new Uint8Array([1]))
    .mockReturnValueOnce(pending.promise);
  const store = cacheZarrChunks(limitZarrStore({get}, 1));
  await store.get('/raster/0.0');
  const miss = store.get('/raster/1.0');
  const hit = store.get('/raster/0.0');
  try {
    await expect(Promise.race([hit, Promise.resolve().then(() => undefined)])).resolves.toEqual(
      new Uint8Array([1])
    );
  } finally {
    pending.resolve(new Uint8Array([2]));
    await Promise.all([miss, hit]);
  }
  expect(get).toHaveBeenCalledTimes(2);
});
