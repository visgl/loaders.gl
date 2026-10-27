// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Tileset2D, createTileMatrixTileset2DAdapter} from '@loaders.gl/tiles';
import type {TileMatrixSelectionGrid, TileMatrixViewFrame} from '@loaders.gl/tiles';

const GRID: TileMatrixSelectionGrid = {
  tileMatrixSet: {
    crs: 'EPSG:32631',
    matrices: [
      {
        id: '1',
        resolution: 4,
        origin: [100, 200],
        cornerOfOrigin: 'topLeft',
        tileSize: [2, 1],
        matrixSize: [2, 2]
      },
      {
        id: 'detail',
        resolution: 2,
        origin: [100, 200],
        cornerOfOrigin: 'topLeft',
        tileSize: [2, 1],
        matrixSize: [4, 4],
        variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 3}]
      }
    ]
  },
  limits: [{tileMatrix: 'detail', minTileColumn: 1, maxTileColumn: 1, minTileRow: 0, maxTileRow: 1}]
};
const FRAME: TileMatrixViewFrame = {crs: 'EPSG:32631', extent: [100, 196, 108, 200], resolution: 2};

test('TileMatrix traversal carries canonical IDs and metadata through shared source requests', async () => {
  const requests: any[] = [];
  const source = {
    getMetadata: async () => ({tileGrid: GRID}),
    getTileData: async (request: any) => {
      requests.push(request);
      return {byteLength: 1};
    }
  };
  const adapter = createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'source:style:time'});
  const tileset = new Tileset2D({tileSource: source as any, adapter});
  const indices = tileset.getTileIndices({viewState: FRAME, zRange: null});
  expect(indices).toEqual([
    {x: 0, y: 0, z: 1, tileMatrix: 'detail'},
    {x: 0, y: 1, z: 1, tileMatrix: 'detail'}
  ]);
  const first = tileset.getTile({...indices[0], x: 1}, true);
  const alias = tileset.getTile(indices[0], true);
  expect(alias).toBe(first);
  await first.data;
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    index: indices[0],
    tileMatrix: 'detail',
    crs: 'EPSG:32631',
    tileSize: [2, 1],
    bbox: {left: 100, right: 108, bottom: 198, top: 200}
  });
  expect(requests[0].signal).toBeInstanceOf(AbortSignal);
  expect(first.id).toBe(JSON.stringify(['source:style:time', 'EPSG:32631', 'detail', 0, 0]));
  expect(first.tileSize).toEqual([2, 1]);
  expect(first.boundingBox).toEqual([
    [100, 198],
    [108, 200]
  ]);
  tileset.prepareTiles();
  expect(first.parent).toBeNull();
  const firstConsumer = Symbol('first');
  const secondConsumer = Symbol('second');
  tileset.attachConsumer(firstConsumer);
  tileset.attachConsumer(secondConsumer);
  tileset.updateConsumer(firstConsumer, [first], [first]);
  tileset.updateConsumer(secondConsumer, [alias], [alias]);
  expect(tileset.selectedTiles).toEqual([first]);
  expect(requests).toHaveLength(1);
  tileset.finalize();
});

test('TileMatrix adapter uses namespace and native matrix identity, validates inputs, and budgets selection', () => {
  const adapter = createTileMatrixTileset2DAdapter(GRID, {
    cacheNamespace: 'source-a',
    maximumTileCount: 2
  });
  const second = createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'source-b'});
  const tile = {x: 0, y: 0, z: 1, tileMatrix: 'detail'};
  expect(adapter.getTileId!(tile)).not.toBe(second.getTileId!(tile));
  expect(adapter.getTileId!(tile)).toBe(adapter.getTileId!({...tile, z: 0}));
  expect(() => adapter.getTileId!({...tile, tileMatrix: 'unknown'})).toThrow('Unknown');
  expect(() => adapter.getTileId!({...tile, tileMatrix: undefined})).toThrow('native matrix');
  expect(() => adapter.getTileId!({...tile, x: 3})).toThrow('coverage');
  expect(() => createTileMatrixTileset2DAdapter({}, {cacheNamespace: 'source'})).toThrow(
    'complete geometry'
  );
  expect(() => createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: ' '})).toThrow('namespace');
  expect(() =>
    adapter.getTileIndices({viewState: {...FRAME, crs: 'other'}, tileSize: 512})
  ).toThrow('exact grid CRS');
  const limited = createTileMatrixTileset2DAdapter(GRID, {
    cacheNamespace: 'source',
    maximumTileCount: 1
  });
  expect(() => limited.getTileIndices({viewState: FRAME, tileSize: 512})).toThrow(
    'maximumTileCount'
  );
});

test('source and adapter changes invalidate cached content and stale metadata', async () => {
  let resolveOldMetadata!: (value: any) => void;
  const oldMetadata = new Promise(resolve => {
    resolveOldMetadata = resolve;
  });
  const oldSource = {getMetadata: () => oldMetadata, getTileData: async () => 'old'};
  const newSource = {getMetadata: async () => ({minZoom: 3}), getTileData: async () => 'new'};
  const adapter = createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'content-v1'});
  const tileset = new Tileset2D({tileSource: oldSource as any, adapter});
  const [index] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const first = tileset.getTile(index, true);
  await first.data;
  const consumer = Symbol('consumer');
  tileset.attachConsumer(consumer);
  tileset.updateConsumer(consumer, [first], [first]);
  const unloaded: string[] = [];
  tileset.subscribe({onTileUnload: tile => unloaded.push(tile.id)});
  tileset.setOptions({tileSource: newSource as any});
  expect(unloaded).toEqual([first.id]);
  expect(tileset.tiles).toEqual([]);
  expect(tileset.selectedTiles).toEqual([]);
  resolveOldMetadata({minZoom: 99});
  await oldMetadata;
  await Promise.resolve();
  expect(tileset.sourceMetadata?.minZoom).toBe(3);
  const [newIndex] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const replacement = tileset.getTile(newIndex, true);
  expect(replacement).not.toBe(first);
  expect(await replacement.data).toBe('new');
  tileset.setOptions({
    adapter: createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'content-v2'})
  });
  expect(tileset.tiles).toEqual([]);
  tileset.finalize();
});

test('bottom-left native frames preserve full coalesced bounds', () => {
  const grid: TileMatrixSelectionGrid = {
    tileMatrixSet: {
      crs: 'native',
      matrices: [
        {
          id: 'bottom',
          resolution: 1,
          origin: [0, 0],
          cornerOfOrigin: 'bottomLeft',
          tileSize: [4, 2],
          matrixSize: [2, 2],
          variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 0}]
        }
      ]
    }
  };
  const adapter = createTileMatrixTileset2DAdapter(grid, {cacheNamespace: 'bottom'});
  const tileset = new Tileset2D({adapter, getTileData: () => null});
  const [index] = tileset.getTileIndices({
    viewState: {crs: 'native', extent: [0, 0, 8, 2], resolution: 1},
    zRange: null
  });
  const tile = tileset.getTile(index, true);
  expect(tile.bbox).toEqual({left: 0, bottom: 0, right: 8, top: 2});
  expect(tile.boundingBox).toEqual([
    [0, 0],
    [8, 2]
  ]);
  tileset.finalize();
});

test('custom parent hooks must advance toward a lower level', () => {
  const adapter = createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'invalid-parent'});
  const tileset = new Tileset2D({
    adapter: {...adapter, getParentIndex: index => index},
    getTileData: () => null
  });
  const [index] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  tileset.getTile(index, true);
  expect(() => tileset.prepareTiles()).toThrow('lower level');
  tileset.finalize();
});

test('switching a source aborts pending requests and suppresses their late results', async () => {
  let resolveOld!: (value: string) => void;
  let resolveStarted!: () => void;
  let oldSignal: AbortSignal | undefined;
  const started = new Promise<void>(resolve => {
    resolveStarted = resolve;
  });
  const oldData = new Promise<string>(resolve => {
    resolveOld = resolve;
  });
  const oldSource = {
    getMetadata: async () => ({}),
    getTileData: ({signal}: {signal: AbortSignal}) => {
      oldSignal = signal;
      resolveStarted();
      return oldData;
    }
  };
  const replacement = {getMetadata: async () => ({}), getTileData: async () => 'new'};
  const tileset = new Tileset2D({
    tileSource: oldSource as any,
    adapter: createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'source'})
  });
  const [index] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const oldTile = tileset.getTile(index, true);
  let loads = 0;
  tileset.subscribe({onTileLoad: () => loads++});
  await started;
  const oldLoad = oldTile.data as Promise<unknown>;
  tileset.setOptions({tileSource: replacement as any});
  expect(oldSignal?.aborted).toBe(true);
  resolveOld('stale');
  await oldLoad;
  expect(loads).toBe(0);
  const [newIndex] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const newTile = tileset.getTile(newIndex, true);
  expect(await newTile.data).toBe('new');
  expect(loads).toBe(1);
  tileset.finalize();
});
