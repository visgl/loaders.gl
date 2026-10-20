// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {createTileGrid, TileSourceAdapter} from '@loaders.gl/core/loader-utils';

/** Returns a small projected, south-up grid with irregular native matrix IDs. */
function createGrid() {
  return createTileGrid('EPSG:32610', [
    {
      id: 'coarse',
      origin: [100, 200],
      resolution: 2,
      resolutionY: 3,
      cornerOfOrigin: 'bottomLeft',
      tileSize: [4, 2],
      matrixSize: [3, 2]
    },
    {
      id: 'fine',
      origin: [100, 200],
      resolution: 1,
      resolutionY: 1.5,
      cornerOfOrigin: 'bottomLeft',
      tileSize: [8, 4],
      matrixSize: [3, 2]
    }
  ]);
}

test('Image adapter selects native matrix IDs, dimensions, bounds and CRS without reprojection', async () => {
  const getImage = vi.fn(async parameters => parameters);
  const grid = createGrid();
  const adapter = new TileSourceAdapter(
    {getMetadata: async () => ({name: 'projected', keywords: [], layers: []}), getImage} as any,
    grid
  );
  const signal = new AbortController().signal;
  const image = await adapter.getTileData({
    index: {z: 0, x: 1, y: 1},
    tileMatrix: 'fine',
    signal
  } as any);
  expect(image).toMatchObject({
    boundingBox: [
      [108, 206],
      [116, 212]
    ],
    width: 8,
    height: 4,
    crs: 'EPSG:32610',
    signal
  });
  expect((await adapter.getMetadata()).tileGrid).toBe(grid);
  expect(() => adapter.getTile({z: 0, x: 0, y: 0, tileMatrix: 'missing'})).toThrow(/Unknown/);
  expect(() => adapter.getTile({z: 0, x: 0, y: 0, crs: 'EPSG:4326'})).toThrow(/reprojection/);
});

test('Image adapter enforces declared coverage and world dimensions before requesting pixels', async () => {
  const getImage = vi.fn();
  const grid = {
    ...createGrid(),
    limits: [
      {tileMatrix: 'coarse', minTileColumn: 1, maxTileColumn: 1, minTileRow: 0, maxTileRow: 0}
    ]
  };
  const adapter = new TileSourceAdapter({getMetadata: async () => ({}), getImage} as any, grid);
  for (const request of [
    {z: 0, x: 0, y: 0},
    {z: 0, x: 1, y: 1},
    {z: 1, x: 0, y: 0},
    {z: 8, x: 0, y: 0},
    {z: 0, x: 3, y: 0}
  ]) {
    expect(await adapter.getTile(request)).toBeNull();
  }
  expect(getImage).not.toHaveBeenCalled();
  await adapter.getTile({z: 0, x: 1, y: 0});
  expect(getImage).toHaveBeenCalledOnce();
});

test('Legacy XYZ bounds use exponentiation and report their actual longitude/latitude CRS', async () => {
  const adapter = new TileSourceAdapter({
    getMetadata: async () => ({}),
    getImage: async parameters => parameters
  } as any);
  const image = await adapter.getTile({z: 1, x: 0, y: 0});
  expect(image).toMatchObject({crs: 'EPSG:4326', width: 512, height: 512});
  expect((image as any).boundingBox[0]).toEqual([-180, 0]);
  expect((image as any).boundingBox[1][0]).toBe(0);
  expect((image as any).boundingBox[1][1]).toBeCloseTo(85.05112878);
  expect(() => adapter.getTile({z: -1, x: 0, y: 0})).toThrow(/Invalid XYZ/);
  expect(() => adapter.getTile({z: 0, x: 0, y: 0, tileMatrix: 'x'})).toThrow(/configured grid/);
  expect(() => new TileSourceAdapter({} as any, {matrices: [{id: 'partial'}]})).toThrow(/complete/);
});
