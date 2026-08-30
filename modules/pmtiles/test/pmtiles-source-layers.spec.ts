// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import type {Header} from 'pmtiles';
import type {CoreAPI} from '@loaders.gl/loader-utils';
import type {MVTLoaderOptions} from '@loaders.gl/mvt';
import {PMTilesTileSource} from '../src/pmtiles-source-loader';

/** Creates a valid compact PMTiles header for source metadata tests. */
function createHeader(tileType = 1): Header {
  return {
    specVersion: 3,
    rootDirectoryOffset: 127,
    rootDirectoryLength: 0,
    jsonMetadataOffset: 127,
    jsonMetadataLength: 0,
    leafDirectoryOffset: 127,
    leafDirectoryLength: 0,
    tileDataOffset: 127,
    tileDataLength: 0,
    addressedTilesCount: 0,
    tileEntriesCount: 0,
    tileContentsCount: 0,
    clustered: true,
    internalCompression: 1,
    tileCompression: 1,
    tileType,
    minZoom: 1,
    maxZoom: 8,
    minLon: -10,
    minLat: -5,
    maxLon: 10,
    maxLat: 5,
    centerLon: 0,
    centerLat: 0,
    centerZoom: 4,
    etag: 'test'
  } as Header;
}

afterEach(() => {
  vi.useRealTimers();
});

test('PMTilesTileSource#getVectorTile forwards requested layers to the decoder', async () => {
  const receivedOptions: MVTLoaderOptions[] = [];
  const source = Object.assign(Object.create(PMTilesTileSource.prototype), {
    options: {pmtiles: {shape: 'arrow-table'}},
    loadOptions: {mvt: {layerProperty: 'sourceLayer', layers: ['fallback']}},
    coreApi: {
      async parse(_data: unknown, _loaders: unknown, options: MVTLoaderOptions) {
        receivedOptions.push(options);
        return {shape: 'arrow-table'};
      }
    } as unknown as CoreAPI,
    async getTile() {
      return new ArrayBuffer(1);
    }
  }) as PMTilesTileSource;

  await source.getVectorTile({x: 2, y: 1, z: 3, layers: ['roads']});
  await source.getVectorTile({x: 2, y: 1, z: 3, layers: []});

  expect(receivedOptions[0].mvt).toMatchObject({
    shape: 'arrow-table',
    coordinates: 'wgs84',
    tileIndex: {x: 2, y: 1, z: 3},
    layerProperty: 'sourceLayer',
    layers: ['roads']
  });
  expect(receivedOptions[1].mvt?.layers).toEqual(['fallback']);
});

describe('PMTilesTileSource runtime paths', () => {
  test('loads schema and normalized metadata', async () => {
    const source = Object.assign(Object.create(PMTilesTileSource.prototype), {
      options: {attributions: ['enabled'], core: {attributions: ['application']}},
      loadOptions: {},
      pmtiles: {
        getHeader: vi.fn(async () => createHeader()),
        getMetadata: vi.fn(async () => ({name: 'tiles', vector_layers: []}))
      },
      mimeType: null
    }) as PMTilesTileSource;

    await expect(source.getSchema()).resolves.toEqual({fields: [], metadata: {}});
    const metadata = await source.getMetadata();
    expect(metadata).toMatchObject({
      name: 'tiles',
      tileMIMEType: 'application/vnd.mapbox-vector-tile'
    });
    expect(metadata.attributions).toEqual(['application']);
    expect(source.mimeType).toBe('application/vnd.mapbox-vector-tile');
  });

  test('returns tile bytes and reports missing or failed responses', async () => {
    const reportError = vi.fn();
    const source = Object.assign(Object.create(PMTilesTileSource.prototype), {
      url: 'memory://tiles',
      reportError,
      getZxyBatched: vi
        .fn()
        .mockResolvedValueOnce({data: new Uint8Array([1, 2]).buffer})
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('range failed'))
    }) as any;

    await expect(source.getTile({x: 1, y: 2, z: 3})).resolves.toEqual(
      new Uint8Array([1, 2]).buffer
    );
    await expect(source.getTile({x: 1, y: 2, z: 3})).resolves.toBeNull();
    await expect(source.getTile({x: 1, y: 2, z: 3})).resolves.toBeNull();
    expect(reportError).toHaveBeenCalledTimes(2);
  });

  test('dispatches tile data and batch helpers by MIME type', async () => {
    const source = Object.assign(Object.create(PMTilesTileSource.prototype), {
      metadata: Promise.resolve({tileMIMEType: 'application/vnd.mapbox-vector-tile'}),
      getVectorTile: vi.fn(async parameters => ({kind: 'vector', parameters})),
      getImageTile: vi.fn(async parameters => ({kind: 'image', parameters})),
      getTile: vi.fn(async parameters => parameters)
    }) as any;

    await expect(source.getTileData({index: {x: 1, y: 2, z: 3}})).resolves.toMatchObject({
      kind: 'vector'
    });
    source.metadata = Promise.resolve({tileMIMEType: 'image/png'});
    await expect(source.getTileData({index: {x: 4, y: 5, z: 6}})).resolves.toMatchObject({
      kind: 'image'
    });
    expect(source.getTileBatch([{x: 1, y: 2, z: 3}])).toHaveLength(1);
    expect(source.getTileDataBatch([{index: {x: 1, y: 2, z: 3}}])).toHaveLength(1);
  });

  test('parses image and vector tiles and preserves inherited options', async () => {
    const parse = vi.fn(async (_data, loader, options) => ({loader: loader.id, options}));
    const source = Object.assign(Object.create(PMTilesTileSource.prototype), {
      options: {pmtiles: {}},
      loadOptions: {mvt: {shape: 'binary-geometry', layers: ['fallback']}},
      coreApi: {parse} as unknown as CoreAPI,
      getTile: vi.fn(async () => new ArrayBuffer(1))
    }) as PMTilesTileSource;

    await expect(source.getImageTile({x: 0, y: 0, z: 0})).resolves.toMatchObject({
      loader: 'imagebitmap'
    });
    const vector = (await source.getVectorTile({x: 2, y: 3, z: 4, layers: 'roads'})) as any;
    expect(vector.options.mvt).toMatchObject({
      shape: 'binary-geometry',
      coordinates: 'wgs84',
      tileIndex: {x: 2, y: 3, z: 4},
      layers: ['roads']
    });
    source.getTile = vi.fn(async () => null);
    await expect(source.getImageTile({x: 0, y: 0, z: 0})).resolves.toBeNull();
    await expect(source.getVectorTile({x: 0, y: 0, z: 0})).resolves.toBeNull();
  });

  test('batches URL requests and directly reads Blob requests', async () => {
    vi.useFakeTimers();
    const getZxy = vi.fn(async (z, x, y) => ({data: new Uint8Array([z, x, y]).buffer}));
    const source = Object.assign(Object.create(PMTilesTileSource.prototype), {
      data: 'https://example.com/tiles.pmtiles',
      options: {rangeRequests: {batchDelayMs: 5}},
      pmtiles: {getZxy},
      pendingTileRequests: [],
      tileBatchTimer: null
    }) as any;
    const first = source.getZxyBatched(1, 2, 3);
    const second = source.getZxyBatched(4, 5, 6);
    expect(getZxy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5);
    await expect(first).resolves.toBeTruthy();
    await expect(second).resolves.toBeTruthy();
    expect(getZxy).toHaveBeenCalledTimes(2);

    source.data = new Blob();
    await expect(source.getZxyBatched(7, 8, 9)).resolves.toBeTruthy();
    expect(getZxy).toHaveBeenLastCalledWith(7, 8, 9, undefined);
  });
});
