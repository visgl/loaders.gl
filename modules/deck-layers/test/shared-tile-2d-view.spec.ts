// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Viewport} from '@deck.gl/core';
import {Matrix4} from '@math.gl/core/matrix';
import {
  STRATEGY_DEFAULT,
  STRATEGY_NEVER,
  STRATEGY_REPLACE,
  Tileset2D,
  createTileMatrixTileset2DAdapter,
  type TileMatrixViewFrame,
  type Tileset2DAdapter
} from '@loaders.gl/tiles/tileset-2d';
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
  STRATEGY_DEFAULT,
  STRATEGY_REPLACE
] as const)('%s refinement provides best-effort coverage for a straddling fine tile', async refinementStrategy => {
  const frame: TileMatrixViewFrame = {crs: 'native', extent: [1, 1, 2.5, 2], resolution: 2};
  const adapter = createTileMatrixTileset2DAdapter(
    {
      tileMatrixSet: {
        crs: frame.crs,
        matrices: [1, 2, 4].map((resolution, index) => ({
          id: String(index),
          resolution,
          origin: [resolution === 1 ? 0 : -4, 0],
          cornerOfOrigin: 'bottomLeft',
          tileSize: [3, 3],
          matrixSize: [2, 1]
        }))
      }
    },
    {cacheNamespace: 'overviews'}
  );
  let finishFineTile!: (content: string) => void;
  const fineData = new Promise<string>(resolve => {
    finishFineTile = resolve;
  });
  const tileset = new Tileset2D<string, Viewport>({
    adapter: {
      getTileIndices: ({viewState, ...context}) =>
        adapter.getTileIndices({
          ...context,
          viewState: {...frame, resolution: viewState.resolution}
        }),
      getTileBoundingBox: (context, index) =>
        adapter.getTileBoundingBox({...context, viewState: frame}, index),
      getTileId: adapter.getTileId,
      getParentIndex: adapter.getParentIndex
    },
    getTileData: ({index}) => (index.tileMatrix === '0' ? fineData : 'overview'),
    refinementStrategy
  });
  const view = new SharedTile2DView(tileset);
  try {
    view.update(new Viewport({zoom: 1, resolution: 2}));
    expect(view.selectedTiles).toHaveLength(2);
    const [leftCoarseTile, rightCoarseTile] = view.selectedTiles!;
    expect(await Promise.all([leftCoarseTile.data, rightCoarseTile.data])).toEqual([
      'overview',
      'overview'
    ]);
    expect(leftCoarseTile.isLoaded).toBe(true);
    expect(rightCoarseTile.isLoaded).toBe(true);
    expect(leftCoarseTile.bbox).toMatchObject({left: -4, right: 2});
    expect(rightCoarseTile.bbox).toMatchObject({left: 2, right: 8});

    const fineViewport = new Viewport({zoom: 2, resolution: 1});
    view.update(fineViewport);
    expect(view.selectedTiles).toHaveLength(1);
    const [fineTile] = view.selectedTiles!;
    expect(fineTile.index).toMatchObject({z: 2, tileMatrix: '0'});
    expect(fineTile.bbox).toMatchObject({left: 0, right: 3});
    expect(fineTile.parent).toBe(leftCoarseTile);
    expect(fineTile.isLoaded).toBe(false);
    expect(view.isTileVisible(fineTile)).toBe(false);
    expect(view.isTileVisible(leftCoarseTile)).toBe(true);
    expect(tileset.getTile(rightCoarseTile.index)).toBe(rightCoarseTile);
    // The cached right tile overlaps (2, 3] and is invisible during refinement.
    expect(view.isTileVisible(rightCoarseTile)).toBe(false);

    finishFineTile('detail');
    expect(await fineTile.data).toBe('detail');
    expect(fineTile.isLoaded).toBe(true);
  } finally {
    view.finalize();
    tileset.finalize();
  }
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
  expect(view.isTileVisible(grandchild)).toBe(!ancestorVisible);
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
