// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {ArcGISMapTileSource} from '../src/arcgis/arcgis-map-tile-source-loader';
import {ArcGISImageTileSource} from '../src/arcgis/arcgis-image-tile-source-loader';
import {ArcGISVectorTileServerSource} from '../src/arcgis/arcgis-vector-tile-server-source-loader';

test.each([
  ArcGISMapTileSource.prototype,
  ArcGISImageTileSource.prototype,
  ArcGISVectorTileServerSource.prototype
])('ArcGIS tile wrapper preserves native LOD and cancellation (%j)', async prototype => {
  const signal = new AbortController().signal;
  const getTile = vi.fn(async () => null);
  await prototype.getTileData.call(
    {getTile, getVectorTile: getTile} as any,
    {index: {z: 0, x: 2, y: 1}, tileMatrix: 'LOD-7', signal} as any
  );
  expect(getTile.mock.calls[0][0]).toEqual({z: 0, x: 2, y: 1, tileMatrix: 'LOD-7', signal});
});
