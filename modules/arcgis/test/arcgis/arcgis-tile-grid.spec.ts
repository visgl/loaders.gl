// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {CoreAPI} from '@loaders.gl/core/loader-utils';
import {ArcGISMapTileSource} from '../../src/arcgis/arcgis-map-tile-source-loader';
import {ArcGISImageTileSource} from '../../src/arcgis/arcgis-image-tile-source-loader';
import {
  ArcGISMapTileSourceLoader,
  ArcGISVectorTileServerSourceLoader
} from '@loaders.gl/arcgis/bundled';
import {createArcGISTileGrid} from '../../src/arcgis/arcgis-tile-grid';

const TILE_INFO = {
  origin: {x: 200000, y: 4600000},
  cols: 512,
  rows: 256,
  spatialReference: {wkid: 26910},
  lods: [
    {level: 2, resolution: 10},
    {level: 7, resolution: 2}
  ]
};

test('ArcGIS raster and vector sources expose the same partial native grid', async () => {
  const raster = ArcGISMapTileSourceLoader.createDataSource('https://example.com/MapServer', {
    'arcgis-map-server': {
      metadata: {tileInfo: TILE_INFO, fullExtent: {xmin: 0, ymin: 0, xmax: 1, ymax: 1}}
    }
  });
  const vector = ArcGISVectorTileServerSourceLoader.createDataSource(
    'https://example.com/VectorTileServer',
    {}
  );
  vector.fetch = async () => Response.json({tileInfo: TILE_INFO});
  const rasterMetadata = await raster.getMetadata();
  const vectorMetadata = await vector.getMetadata();
  expect(rasterMetadata.tileGrid).toEqual(vectorMetadata.tileGrid);
  expect(rasterMetadata.minZoom).toBe(2);
  expect(rasterMetadata.maxZoom).toBe(7);
  expect(rasterMetadata.tileGrid?.matrices).toEqual([
    {id: '2', resolution: 10, origin: [200000, 4600000], tileSize: [512, 256]},
    {id: '7', resolution: 2, origin: [200000, 4600000], tileSize: [512, 256]}
  ]);
  expect(rasterMetadata.tileGrid?.tileMatrixSet).toBeUndefined();
  expect(rasterMetadata.tileGrid?.matrixSizes).toBeUndefined();
  expect(() => raster.getExportTileURL({z: 0, x: 1, y: 2, tileMatrix: '7'})).toThrow(
    'matching XYZ zoom'
  );
  expect(raster.getTileURL({z: 0, x: 1, y: 2, tileMatrix: '7'})).toContain('/tile/7/2/1');
  expect(vector.getTileURL({z: 0, x: 1, y: 2, tileMatrix: '7'})).toContain('/tile/7/2/1.pbf');
  expect(vector.getTileURL({z: 0, x: 1, y: 2})).toContain('/tile/2/2/1.pbf');
  expect(() => vector.getTileURL({z: 99, x: 0, y: 0})).toThrow('No tile matrix');
  expect(() => vector.getTileURL({z: 0, x: 0, y: 0, tileMatrix: 'missing'})).toThrow(
    'Unknown tile matrix'
  );
  await expect(vector.getVectorTile({z: 0, x: 0, y: 0, tileMatrix: '7'})).rejects.toThrow(
    'matching XYZ zoom'
  );
});

test('ArcGIS normalization retains header metadata and handles CRS aliases without dimensions', () => {
  expect(createArcGISTileGrid(undefined)).toBeUndefined();
  expect(
    createArcGISTileGrid({cols: 512, rows: 256, origin: {x: 1, y: 2}}, {wkid: 102100})
  ).toMatchObject({crs: 'EPSG:3857', tileSize: [512, 256], origin: [1, 2]});
  expect(createArcGISTileGrid({lods: [{level: 3}]}, {wkid: 102113, latestWkid: 3857})?.crs).toBe(
    'EPSG:3857'
  );
  expect(createArcGISTileGrid({}, {wkt: 'LOCAL_CS["test"]'})?.crs).toBe('LOCAL_CS["test"]');
  expect(createArcGISTileGrid({lods: [{level: 3}]})?.matrices).toEqual([{id: '3'}]);
  expect(() => createArcGISTileGrid({lods: [{level: 1}, {level: 1}]})).toThrow('unique');
  expect(() => createArcGISTileGrid({lods: [{level: -1}]})).toThrow('nonnegative');
});

test('ArcGIS consumer requests the cached native LOD and rejects mismatched dynamic exports', async () => {
  const fetcher = vi.fn(async () => new Response(new Uint8Array(1)));
  const source = new ArcGISMapTileSource(
    'https://example.com/MapServer',
    {
      'arcgis-map-server': {mode: 'cached', metadata: {tileInfo: TILE_INFO}},
      core: {fetch: fetcher}
    },
    {parse: async () => ({width: 512, height: 256})} as unknown as CoreAPI
  );
  const signal = new AbortController().signal;
  await source.getTileData({index: {z: 0, x: 1, y: 2}, tileMatrix: '7', signal});
  expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/tile/7/2/1'), {signal});
  const image = new ArcGISImageTileSource('https://example.com/ImageServer', {
    core: {fetch: fetcher}
  });
  fetcher.mockClear();
  await expect(image.getTileData({index: {z: 0, x: 0, y: 0}, tileMatrix: '7'})).rejects.toThrow(
    'matching XYZ zoom'
  );
  expect(fetcher).not.toHaveBeenCalled();
});
