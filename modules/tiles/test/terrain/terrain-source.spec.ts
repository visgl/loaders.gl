// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {TerrainSampleStatus} from '@math.gl/geospatial/terrain';
import type {Tileset2DAdapter} from '../../src/tileset-2d';
import {TerrainSource, reconcileTerrainTiles} from '../../src/terrain';

const adapter: Tileset2DAdapter<null> = {
  getTileIndices: () => [{x: 0, y: 0, z: 0}],
  getTileBoundingBox: () => ({left: 0, right: 2, top: 2, bottom: 0})
};
const heights = () => ({
  width: 2,
  height: 2,
  heights: new Float32Array([0, 10, 20, 30]),
  origin: [0, 0] as const,
  columnStep: [2, 0] as const,
  rowStep: [0, 2] as const,
  registration: 'vertex' as const,
  heightReference: 'unknown'
});

test('TerrainSource shares decoded terrain through one tileset across consumers', async () => {
  const loadTile = vi.fn(async () => heights());
  const source = new TerrainSource<null>({
    metadata: {minZoom: 0, maxZoom: 1},
    loadTile,
    tileset: {adapter}
  });
  const tileset = source.tileset;
  const [index] = tileset.getTileIndices({viewState: null, zRange: null});
  const first = tileset.getTile(index, true);
  const second = tileset.getTile(index, true);
  expect(first).toBe(second);
  const content = await first.data;
  expect(content).not.toBeNull();
  expect(loadTile).toHaveBeenCalledTimes(1);
  expect(loadTile).toHaveBeenCalledWith(
    expect.objectContaining({bbox: {left: 0, right: 2, top: 2, bottom: 0}})
  );
  expect(content!.field.sample(1, 1)).toMatchObject({
    status: TerrainSampleStatus.VALID,
    height: 15
  });
  expect(content!.byteLength).toBe(20);
  expect(content!.createMesh().indices).toHaveLength(6);
  expect(content!.createBounds().query()).toMatchObject({heightRange: [0, 30]});
  expect(content!.createGeometry().attributes.POSITION).toBeDefined();
  tileset.prepareTiles();
  const viewA = Symbol('view-a'),
    viewB = Symbol('view-b');
  tileset.attachConsumer(viewA);
  tileset.attachConsumer(viewB);
  tileset.updateConsumer(viewA, [first], [first]);
  tileset.updateConsumer(viewB, [second], [second]);
  tileset.detachConsumer(viewA);
  expect(tileset.selectedTiles).toContain(second);
  tileset.detachConsumer(viewB);
  source.finalize();
});

test('TerrainSource rejects a late tile after the consumer cancels', async () => {
  let complete!: (value: ReturnType<typeof heights>) => void;
  const source = new TerrainSource({
    metadata: {},
    loadTile: () =>
      new Promise(resolve => {
        complete = resolve;
      })
  });
  const controller = new AbortController();
  const result = source.getTile({x: 0, y: 0, z: 0, signal: controller.signal});
  controller.abort();
  complete(heights());
  await expect(result).rejects.toBeDefined();
  source.finalize();
});

test('TerrainSource preserves matrix identity, missing tiles and cancellation', async () => {
  const loadTile = vi.fn(async ({x}) => (x === 1 ? null : heights()));
  const source = new TerrainSource({metadata: {}, loadTile});
  expect(await source.getTile({x: 1, y: 0, z: 0})).toBeNull();
  await source.getTileData({
    index: {x: 0, y: 0, z: 1},
    tileMatrix: 'native',
    id: '0',
    bbox: {left: 0, right: 1, top: 1, bottom: 0}
  });
  expect(loadTile).toHaveBeenLastCalledWith(expect.objectContaining({tileMatrix: 'native'}));
  const controller = new AbortController();
  controller.abort();
  await expect(source.getTile({x: 0, y: 0, z: 0, signal: controller.signal})).rejects.toBeDefined();
  source.finalize();
});

test('TerrainSource snapshots source heights and validity in the supplied frame', async () => {
  const input = heights();
  const validity = new Uint8Array([1, 0, 1, 1]);
  const source = new TerrainSource({metadata: {}, loadTile: async () => ({...input, validity})});
  const tile = await source.getTile({x: 0, y: 0, z: 0});
  input.heights.fill(999);
  validity.fill(0);
  expect(tile!.field.getHeight(0, 0)).toBe(0);
  expect(tile!.field.getHeight(1, 0)).toBeUndefined();
  expect(tile!.field.sample(1, 1).status).toBe(TerrainSampleStatus.NO_DATA);
  source.finalize();
});

test('TerrainSource requires explicit source-frame metadata', async () => {
  const source = new TerrainSource({
    metadata: {},
    loadTile: async () => ({width: 2, height: 2, heights: new Float32Array(4)}) as any
  });
  await expect(source.getTile({x: 0, y: 0, z: 0})).rejects.toThrow(/explicit frame/);
  source.finalize();
});

test('same-level terrain seams reconcile detached view snapshots', async () => {
  const source = new TerrainSource({
    metadata: {},
    loadTile: async ({x}) => ({
      ...heights(),
      origin: [x * 2, 0] as const,
      heights: x ? new Float32Array([11, 40, 31, 50]) : new Float32Array([0, 10, 20, 30])
    })
  });
  const west = (await source.getTile({x: 0, y: 0, z: 1}))!;
  const east = (await source.getTile({x: 1, y: 0, z: 1}))!;
  const snapshot = reconcileTerrainTiles(
    [
      {matrixId: '1', column: 0, row: 0, tile: west},
      {matrixId: '1', column: 1, row: 0, tile: east}
    ],
    {maxHeightDifference: 1}
  );
  expect(snapshot.sharedVertices).toBe(2);
  expect(snapshot.maxHeightDifference).toBe(1);
  expect(snapshot.tiles[1].field.getHeight(0, 0)).toBe(10);
  expect(east.field.getHeight(0, 0)).toBe(11);
  expect(() =>
    reconcileTerrainTiles([
      {matrixId: '1', column: 0, row: 0, tile: west},
      {matrixId: '2', column: 1, row: 0, tile: east}
    ])
  ).toThrow(/lattice/);
  source.finalize();
});

test('same-level seams tolerate lattice roundoff near a coordinate-axis crossing', async () => {
  const extent = 20037508.342789244;
  const span = (2 * extent) / 2 ** 14;
  const source = new TerrainSource({
    metadata: {},
    loadTile: async ({x}) => ({
      width: 256,
      height: 2,
      heights: new Float32Array(512),
      origin: [-extent + x * span, 0] as const,
      columnStep: [span / 255, 0] as const,
      rowStep: [0, 1] as const,
      registration: 'vertex' as const,
      heightReference: 'unknown'
    })
  });
  const west = (await source.getTile({x: 8191, y: 0, z: 14}))!;
  const east = (await source.getTile({x: 8192, y: 0, z: 14}))!;
  const snapshot = reconcileTerrainTiles([
    {matrixId: '14', column: 8191, row: 0, tile: west},
    {matrixId: '14', column: 8192, row: 0, tile: east}
  ]);
  expect(snapshot.sharedVertices).toBe(2);
  source.finalize();
});
