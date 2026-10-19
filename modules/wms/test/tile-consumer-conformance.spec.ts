// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {WMTSImageTileSource} from '../src/wmts-source-loader';
import {OGCAPITilesSource} from '../src/ogc-api-source-loader';

// Geometry and coverage are exhaustively tested in their owning modules; this checks the wrapper boundary.
test.each([
  WMTSImageTileSource.prototype,
  OGCAPITilesSource.prototype
])('Tile request wrapper preserves explicit matrix ID and cancellation (%j)', async prototype => {
  const signal = new AbortController().signal;
  const getTile = vi.fn(async () => null);
  await prototype.getTileData.call(
    {getTile} as any,
    {index: {z: 0, x: 2, y: 1}, tileMatrix: 'native-level', signal} as any
  );
  expect(getTile.mock.calls[0][0]).toEqual({z: 0, x: 2, y: 1, tileMatrix: 'native-level', signal});
});
