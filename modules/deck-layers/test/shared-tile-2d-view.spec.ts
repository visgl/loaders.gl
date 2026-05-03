// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Tileset2D, type Tileset2DAdapter} from '@loaders.gl/tiles';
import {SharedTile2DView} from '../src/shared-tile-2d/shared-tile-2d-view';

const TEST_ADAPTER: Tileset2DAdapter<any> = {
  getTileIndices: () => [
    {x: 0, y: 0, z: 0},
    {x: 1, y: 0, z: 0}
  ],
  getTileBoundingBox: (_context, index) => ({
    west: index.x,
    south: index.y,
    east: index.x + 1,
    north: index.y + 1
  })
};

const TEST_VIEWPORT = {
  id: 'test-viewport',
  equals(other) {
    return other === this;
  }
} as any;

test('SharedTile2DView#custom refinement strategies can control visibility', t => {
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: async () => null,
    refinementStrategy: (tiles, setVisible) => {
      setVisible(tiles[0], true);
      setVisible(tiles[1], false);
    }
  });
  const view = new SharedTile2DView(tileset as any);

  view.update(TEST_VIEWPORT);

  const [firstTile, secondTile] = view.selectedTiles || [];
  t.ok(firstTile);
  t.ok(secondTile);
  t.ok(view.isTileVisible(firstTile), 'custom refinement keeps the first tile visible');
  t.notOk(view.isTileVisible(secondTile), 'custom refinement can hide placeholder tiles');

  view.finalize();
  tileset.finalize();
  t.end();
});

test('SharedTile2DView#same-viewport updates reload only stale selected tiles', async t => {
  let requestCount = 0;
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: async ({id}) => {
      requestCount++;
      return {id, byteLength: 1};
    }
  });
  const view = new SharedTile2DView(tileset as any);

  view.update(TEST_VIEWPORT);
  await Promise.all((view.selectedTiles || []).map(tile => tile.data));
  t.equal(requestCount, 2, 'initial viewport update loads both selected tiles');

  const [firstTile] = view.selectedTiles || [];
  firstTile.setNeedsReload();
  view.update(TEST_VIEWPORT);
  await Promise.all((view.selectedTiles || []).map(tile => tile.data));
  t.equal(requestCount, 3, 'same-viewport reload only refreshes the stale tile');

  view.finalize();
  tileset.finalize();
  t.end();
});
