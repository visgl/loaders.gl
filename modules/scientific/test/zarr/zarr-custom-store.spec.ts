// SPDX-License-Identifier: MIT

import {createDataSourceSync} from '@loaders.gl/core';
import type {RasterViewport} from '@loaders.gl/core/loader-utils';
import {
  GeoZarrLoader,
  SpatialDataLoader,
  ZarrArrayLoader
} from '@loaders.gl/scientific/zarr/bundled';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import * as zarrita from 'zarrita';
import type {AsyncReadable} from 'zarrita';
import {limitZarrStore} from '../../src/zarr/lib/limited-zarr-store';

/** Source label that can only be read through the supplied store. */
const SOURCE_LABEL = 'memory://test';

/** A viewport covering both raster chunks. */
const VIEWPORT: RasterViewport = {
  id: 'memory',
  bounds: [
    [0, 0],
    [2, 2]
  ],
  width: 2,
  height: 2,
  zoom: 0,
  center: [1, 1],
  project: coordinates => coordinates,
  unprojectPosition: position => [position[0], position[1], position[2] ?? 0]
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

test.each([
  {chunkCacheProps: undefined, expectedReads: ['/raster/1.0']},
  {chunkCacheProps: false as const, expectedReads: ['/raster/0.0', '/raster/1.0']}
])('encoded chunk reuse across distinct windows with chunkCacheProps=$chunkCacheProps', async ({
  chunkCacheProps,
  expectedReads
}) => {
  const store = createMemoryStore(true);
  const get = vi.spyOn(store, 'get');
  const source = createDataSourceSync(SOURCE_LABEL, [ZarrArrayLoader], {
    zarr: {store, chunkCacheProps},
    zarrArray: {path: 'raster'}
  });
  await source.getMetadata();
  get.mockClear();
  const top = await source.getArray({selection: [{start: 0, stop: 1}, null]});
  expect(top.data).toEqual(new Uint8Array([1, 2]));
  expect(get.mock.calls.map(([key]) => key)).toEqual(['/raster/0.0']);

  get.mockClear();
  const right = await source.getArray({
    selection: [
      {start: 0, stop: 2},
      {start: 1, stop: 2}
    ]
  });
  expect(right.data).toEqual(new Uint8Array([2, 4]));
  expect(get.mock.calls.map(([key]) => key).sort()).toEqual(expectedReads);
});

test('overlapping GeoZarr windows decode only newly entered chunks', async () => {
  const store = createMemoryStore(true);
  const source = createDataSourceSync(SOURCE_LABEL, [GeoZarrLoader], {
    zarr: {store, chunkCacheProps: false},
    geozarr: {array: 'raster'}
  });
  await source.getMetadata();
  const getChunk = vi.spyOn(zarrita.Array.prototype, 'getChunk');
  const first = await source.getRaster({
    viewport: {
      ...VIEWPORT,
      bounds: [
        [0, 1],
        [1, 2]
      ],
      width: 1,
      height: 1
    }
  });
  expect(first.data).toEqual(new Uint8Array([1]));
  expect(getChunk.mock.calls.map(([coordinates]) => coordinates)).toEqual([[0, 0]]);

  getChunk.mockClear();
  const second = await source.getRaster({viewport: VIEWPORT});
  expect(second.data).toEqual(new Uint8Array([1, 2, 3, 4]));
  expect(getChunk.mock.calls.map(([coordinates]) => coordinates)).toEqual([[1, 0]]);
});

test.each([
  {transposed: false, columnMajor: false},
  {transposed: true, columnMajor: false},
  {transposed: false, columnMajor: true},
  {transposed: true, columnMajor: true}
])('GeoZarr matches a whole-window read with transposed=$transposed and columnMajor=$columnMajor', async ({
  transposed,
  columnMajor
}) => {
  const files = new Map<zarrita.AbsolutePath, Uint8Array>();
  const group = await zarrita.create(files);
  const dimensions = transposed ? ['x', 'band', 'y'] : ['y', 'band', 'x'];
  const array = await zarrita.create(group.resolve('raster'), {
    shape: transposed ? [7, 2, 5] : [5, 2, 7],
    chunkShape: transposed ? [3, 2, 2] : [2, 2, 3],
    dimensionNames: dimensions,
    dtype: 'uint16',
    codecs: [
      ...(columnMajor ? [{name: 'transpose', configuration: {order: [2, 1, 0]}}] : []),
      {name: 'bytes', configuration: {endian: 'little'}}
    ],
    fillValue: 999,
    attributes: {
      'proj:code': 'EPSG:4326',
      'spatial:transform': [1, 0, 0, 0, -1, 5]
    }
  });
  // Leave the bottom edge chunks absent to exercise Zarrita's fill handling.
  const populatedShape = transposed ? [7, 2, 4] : [4, 2, 7];
  await zarrita.set(
    array,
    dimensions.map(name => (name === 'y' ? zarrita.slice(0, 4) : null)),
    {
      data: Uint16Array.from({length: 56}, (_, index) => 256 + index),
      shape: populatedShape,
      stride: [2 * populatedShape[2], populatedShape[2], 1]
    }
  );
  const store: AsyncReadable = {get: async key => files.get(key)};
  const source = createDataSourceSync(SOURCE_LABEL, [GeoZarrLoader], {
    zarr: {store, requireConsolidatedMetadata: false},
    geozarr: {array: 'raster'}
  });
  const width = 6;
  const height = 4;
  const raster = await source.getRaster({
    viewport: {
      ...VIEWPORT,
      bounds: [
        [1, 0],
        [7, 4]
      ],
      width,
      height
    },
    selection: {band: 1}
  });
  const selection = dimensions.map(name =>
    name === 'band' ? 1 : zarrita.slice(1, name === 'y' ? 5 : 7)
  );
  const whole = (await zarrita.get(array, selection)) as {data: Uint16Array};
  // GeoZarr's whole-window path applied this transpose when x preceded y.
  const expected = transposed
    ? Uint16Array.from(
        whole.data,
        (_, index) => whole.data[(index % width) * height + Math.floor(index / width)]
      )
    : whole.data;
  expect(raster.data).toBeInstanceOf(Uint16Array);
  expect(raster.data).toEqual(expected);
  expect(expected).toContain(999);
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

test('a GeoZarr window with more than 32 chunks keeps all its decoded chunks', async () => {
  const files = new Map<zarrita.AbsolutePath, Uint8Array>();
  const group = await zarrita.create(files);
  const array = await zarrita.create(group.resolve('raster'), {
    shape: [8, 8],
    chunkShape: [1, 1],
    dimensionNames: ['y', 'x'],
    dtype: 'uint8',
    attributes: {
      'proj:code': 'EPSG:4326',
      'spatial:transform': [1, 0, 0, 0, -1, 8]
    }
  });
  await zarrita.set(array, [null, null], {
    data: Uint8Array.from({length: 64}, (_, index) => index),
    shape: [8, 8],
    stride: [8, 1]
  });
  const store: AsyncReadable = {get: async key => files.get(key)};
  const source = createDataSourceSync(SOURCE_LABEL, [GeoZarrLoader], {
    zarr: {store, requireConsolidatedMetadata: false, chunkCacheProps: false},
    geozarr: {array: 'raster'}
  });
  const viewport: RasterViewport = {
    ...VIEWPORT,
    bounds: [
      [0, 0],
      [8, 8]
    ],
    width: 8,
    height: 8
  };
  await source.getRaster({viewport});
  const getChunk = vi.spyOn(zarrita.Array.prototype, 'getChunk');
  const raster = await source.getRaster({viewport});
  expect(raster.data).toEqual(Uint8Array.from({length: 64}, (_, index) => index));
  expect(getChunk).not.toHaveBeenCalled();
  getChunk.mockRestore();
});
