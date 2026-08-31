// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {
  STRATEGY_DEFAULT,
  STRATEGY_NEVER,
  STRATEGY_REPLACE,
  Tileset2D,
  type Tileset2DAdapter
} from '@loaders.gl/tiles';
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
test('SharedTile2DView#custom refinement strategies can control visibility', () => {
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
  expect(firstTile).toBeTruthy();
  expect(secondTile).toBeTruthy();
  expect(
    view.isTileVisible(firstTile),
    'custom refinement keeps the first tile visible'
  ).toBeTruthy();
  expect(
    view.isTileVisible(secondTile),
    'custom refinement can hide placeholder tiles'
  ).toBeFalsy();
  view.finalize();
  tileset.finalize();
});
test('SharedTile2DView#same-viewport updates reload only stale selected tiles', async () => {
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
  expect(requestCount, 'initial viewport update loads both selected tiles').toBe(2);
  const [firstTile] = view.selectedTiles || [];
  firstTile.setNeedsReload();
  view.update(TEST_VIEWPORT);
  await Promise.all((view.selectedTiles || []).map(tile => tile.data));
  expect(requestCount, 'same-viewport reload only refreshes the stale tile').toBe(3);
  view.finalize();
  tileset.finalize();
});

test.each([
  [STRATEGY_DEFAULT, true],
  [STRATEGY_REPLACE, true],
  [STRATEGY_NEVER, false]
] as const)('SharedTile2DView exercises %s refinement across a tile hierarchy', (strategy, ancestorVisible) => {
  const root = createTile('root', 0);
  const child = createTile('child', 1, root);
  const grandchild = createTile('grandchild', 2, child);
  root.children = [child];
  child.children = [grandchild];
  root.isLoaded = true;
  const tiles = [root, child, grandchild];
  const tileset = createStructuralTileset(tiles, strategy);
  const view = new SharedTile2DView(tileset as any) as any;
  view._selectedTiles = [grandchild];

  expect(view._updateTileStates()).toBe(true);
  expect(view.isTileVisible(root)).toBe(ancestorVisible);
  expect(view.isTileVisible(grandchild)).toBe(!ancestorVisible || strategy === STRATEGY_NEVER);
  expect(view._getVisibleTiles()).toEqual(tiles.filter(tile => view._state.get(tile)?.isVisible));
  expect(view._updateTileStates()).toBe(false);
  view.finalize();
});

test('SharedTile2DView traverses unloaded descendants and culls geographic and cartesian boxes', () => {
  const root = createTile('root', 0);
  const child = createTile('child', 1, root);
  const grandchild = createTile('grandchild', 2, child);
  root.children = [child];
  child.children = [grandchild];
  grandchild.isLoaded = true;
  const view = new SharedTile2DView(
    createStructuralTileset([root, child, grandchild], STRATEGY_DEFAULT) as any
  ) as any;
  view._selectedTiles = [root];
  view._updateTileStates();

  expect(view.isTileVisible(root)).toBe(true);
  expect(view.isTileVisible(grandchild)).toBe(true);
  expect(view._tileOverlapsBounds(root, [-0.5, -0.5, 0.5, 0.5])).toBe(true);
  expect(view._tileOverlapsBounds(root, [2, 2, 3, 3])).toBe(false);

  const cartesianTile = {
    ...createTile('cartesian', 0),
    bbox: {left: 0, top: 2, right: 2, bottom: 0}
  };
  expect(view._tileOverlapsBounds(cartesianTile, [1, 1, 3, 3])).toBe(true);
  expect(view._tileOverlapsBounds(cartesianTile, [3, 3, 4, 4])).toBe(false);
  expect(view._getTileBoundingBox(cartesianTile, Matrix4.IDENTITY)).toEqual(cartesianTile.bbox);
  expect(
    view._getTileBoundingBox(cartesianTile, new Matrix4().translate([10, 20, 0]))
  ).toMatchObject({left: 10, right: 12, top: 20, bottom: 22});
  view.finalize();
});

function createTile(id: string, zoom: number, parent: any = null): any {
  return {
    id,
    zoom,
    index: {x: 0, y: 0, z: zoom},
    parent,
    children: null,
    isLoaded: false,
    content: null,
    needsReload: false,
    bbox: {west: 0, south: 0, east: 1, north: 1}
  };
}

function createStructuralTileset(tiles: any[], refinementStrategy: string): any {
  return {
    tiles,
    refinementStrategy,
    attachConsumer() {},
    detachConsumer() {},
    updateConsumer() {}
  };
}
