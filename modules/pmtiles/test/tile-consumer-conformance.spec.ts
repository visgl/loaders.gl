// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {PMTilesTileSource} from '../src/pmtiles-source-loader';

test.each([
  'application/vnd.mapbox-vector-tile',
  'image/png'
])('PMTiles consumer preserves matrix ID and cancellation (%s)', async tileMIMEType => {
  const signal = new AbortController().signal;
  const getTile = vi.fn(async () => null);
  await PMTilesTileSource.prototype.getTileData.call(
    {
      metadata: Promise.resolve({tileMIMEType}),
      getVectorTile: getTile,
      getImageTile: getTile
    } as any,
    {index: {z: 0, x: 2, y: 1}, tileMatrix: '3', signal} as any
  );
  expect(getTile).toHaveBeenCalledWith({z: 0, x: 2, y: 1, layers: [], tileMatrix: '3', signal});
});
