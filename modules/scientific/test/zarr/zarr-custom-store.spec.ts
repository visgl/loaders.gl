// SPDX-License-Identifier: MIT

import {createDataSourceSync} from '@loaders.gl/core';
import type {RasterViewport} from '@loaders.gl/core/loader-utils';
import {
  GeoZarrLoader,
  SpatialDataLoader,
  ZarrArrayLoader
} from '@loaders.gl/scientific/zarr/bundled';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import type {AsyncReadable} from 'zarrita';
import {limitZarrStore} from '../../src/zarr/lib/limited-zarr-store';

/** Source label that can only be read through the supplied store. */
const SOURCE_LABEL = 'memory://test';

/** A viewport covering both raster chunks. */
const VIEWPORT: RasterViewport = {
  bounds: [
    [0, 0],
    [2, 2]
  ],
  width: 2,
  height: 2
};

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected fetch'));
});

afterEach(() => {
  try {
    expect(globalThis.fetch).not.toHaveBeenCalled();
  } finally {
    vi.restoreAllMocks();
  }
});

test.each([
  true,
  false
])('GeoZarr reads a custom store with consolidated metadata set to %s', async consolidated => {
  const store = createMemoryStore(consolidated);
  const get = vi.spyOn(store, 'get');
  const source = createDataSourceSync(SOURCE_LABEL, [GeoZarrLoader], {
    zarr: consolidated ? {store} : {store, requireConsolidatedMetadata: false},
    geozarr: {array: 'raster'}
  });

  expect(source.options.zarr?.store).toBe(store);
  await expect(source.getMetadata()).resolves.toMatchObject({
    array: 'raster',
    width: 2,
    height: 2,
    crs: 'EPSG:4326'
  });
  if (consolidated) {
    expect(get.mock.calls.map(([key]) => key)).toContain('/.zmetadata');
    await expect(source.getConsolidatedMetadata()).resolves.toMatchObject({
      metadataPath: '.zmetadata',
      topLevelArrays: ['raster']
    });
  } else {
    await expect(source.getConsolidatedMetadata()).rejects.toThrow(/\.zmetadata: 404/);
  }
  expect((await source.getRaster({viewport: VIEWPORT})).data).toEqual(new Uint8Array([1, 2, 3, 4]));
});

test('ZarrArraySource reads array metadata and values from a custom store', async () => {
  const store = createMemoryStore(true);
  const source = createDataSourceSync(SOURCE_LABEL, [ZarrArrayLoader], {
    zarr: {store},
    zarrArray: {path: 'raster'}
  });

  await expect(source.getMetadata()).resolves.toMatchObject({path: 'raster', shape: [2, 2]});
  expect((await source.getArray()).data).toEqual(new Uint8Array([1, 2, 3, 4]));
});

test('GeoZarr limits concurrent chunk reads from a custom store', async () => {
  const memoryStore = createMemoryStore(true);
  const chunkStarted = Promise.withResolvers<void>();
  const releaseChunks = Promise.withResolvers<void>();
  let activeRequests = 0;
  let peakRequests = 0;
  const store: AsyncReadable = {
    async get(key, options) {
      if (key !== '/raster/0.0' && key !== '/raster/1.0') {
        return memoryStore.get(key, options);
      }
      activeRequests++;
      peakRequests = Math.max(peakRequests, activeRequests);
      chunkStarted.resolve();
      try {
        await releaseChunks.promise;
        return await memoryStore.get(key, options);
      } finally {
        activeRequests--;
      }
    }
  };
  const source = createDataSourceSync(SOURCE_LABEL, [GeoZarrLoader], {
    zarr: {store},
    geozarr: {array: 'raster', maxConcurrentRequests: 1}
  });

  const raster = source.getRaster({viewport: VIEWPORT});
  try {
    await Promise.race([chunkStarted.promise, raster]);
  } finally {
    releaseChunks.resolve();
  }
  expect((await raster).data).toEqual(new Uint8Array([1, 2, 3, 4]));
  expect(peakRequests).toBe(1);
});

test('the request limiter preserves optional range reads', async () => {
  const memoryStore = createMemoryStore(false);
  expect(limitZarrStore(memoryStore, 1).getRange).toBeUndefined();

  const store: AsyncReadable = {
    get: memoryStore.get,
    async getRange(key, range, options) {
      const bytes = await this.get(key, options);
      return 'offset' in range
        ? bytes?.slice(range.offset, range.offset + range.length)
        : bytes?.slice(-range.suffixLength);
    }
  };
  const limited = limitZarrStore(store, 1);
  await expect(limited.getRange?.('/raster/0.0', {offset: 1, length: 1})).resolves.toEqual(
    new Uint8Array([2])
  );
});

test('SpatialDataSource rejects a custom store', () => {
  expect(() =>
    createDataSourceSync(SOURCE_LABEL, [SpatialDataLoader], {
      zarr: {store: createMemoryStore(true)}
    })
  ).toThrow('SpatialDataSource does not support zarr.store because its elements require URLs.');
});

/** Creates a two-chunk v2 raster with optional consolidated metadata. */
function createMemoryStore(consolidated: boolean): AsyncReadable {
  const metadata = {
    '.zgroup': {zarr_format: 2},
    'raster/.zarray': {
      zarr_format: 2,
      shape: [2, 2],
      chunks: [1, 2],
      dtype: '|u1',
      fill_value: 0,
      compressor: null,
      filters: null,
      order: 'C'
    },
    'raster/.zattrs': {
      _ARRAY_DIMENSIONS: ['y', 'x'],
      'proj:code': 'EPSG:4326',
      'spatial:transform': [1, 0, 0, 0, -1, 2]
    }
  };
  const documents = consolidated
    ? {...metadata, '.zmetadata': {zarr_consolidated_format: 1, metadata}}
    : metadata;
  const encoder = new TextEncoder();
  const files = new Map<string, Uint8Array>([
    ...Object.entries(documents).map(([path, document]): [string, Uint8Array] => [
      `/${path}`,
      encoder.encode(JSON.stringify(document))
    ]),
    ['/raster/0.0', new Uint8Array([1, 2])],
    ['/raster/1.0', new Uint8Array([3, 4])]
  ]);
  return {get: async key => files.get(key)};
}
