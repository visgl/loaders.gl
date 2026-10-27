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
  const cleanupOwners: string[] = [];
  const tileset = new Tileset2D({
    tileSource: oldSource as any,
    adapter,
    onTileUnload: () => cleanupOwners.push('old')
  });
  const [index] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const first = tileset.getTile(index, true);
  await first.data;
  const consumer = Symbol('consumer');
  tileset.attachConsumer(consumer);
  tileset.updateConsumer(consumer, [first], [first]);
  const unloaded: string[] = [];
  tileset.subscribe({onTileUnload: tile => unloaded.push(tile.id)});
  tileset.setOptions({tileSource: newSource as any, onTileUnload: () => cleanupOwners.push('new')});
  expect(unloaded).toEqual([first.id]);
  expect(cleanupOwners).toEqual(['old']);
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
  const oldDiscards: string[] = [];
  const newDiscards: string[] = [];
  const tileset = new Tileset2D({
    tileSource: oldSource as any,
    adapter: createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'source'}),
    onTileDiscard: (_tile, content) => oldDiscards.push(content as string)
  });
  const [index] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const oldTile = tileset.getTile(index, true);
  let loads = 0;
  tileset.subscribe({onTileLoad: () => loads++});
  await started;
  const oldLoad = oldTile.data as Promise<unknown>;
  tileset.setOptions({
    tileSource: replacement as any,
    onTileDiscard: (_tile, content) => newDiscards.push(content as string)
  });
  expect(oldSignal?.aborted).toBe(true);
  resolveOld('stale');
  await oldLoad;
  expect(oldDiscards).toEqual(['stale']);
  expect(newDiscards).toEqual([]);
  expect(loads).toBe(0);
  const [newIndex] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const newTile = tileset.getTile(newIndex, true);
  expect(await newTile.data).toBe('new');
  expect(loads).toBe(1);
  tileset.finalize();
});

test('native extent and compatibility level limits are applied before selection', () => {
  const unrestricted = {tileMatrixSet: GRID.tileMatrixSet};
  const adapter = createTileMatrixTileset2DAdapter(unrestricted, {cacheNamespace: 'bounded'});
  const tileset = new Tileset2D({
    adapter,
    getTileData: () => null,
    minZoom: 1,
    maxZoom: 1,
    extent: [100, 198, 108, 200]
  });
  const coarseFrame = {...FRAME, resolution: 4};
  expect(tileset.getTileIndices({viewState: coarseFrame, zRange: null})).toEqual([
    {x: 0, y: 0, z: 1, tileMatrix: 'detail'}
  ]);
  expect(
    tileset.getTileIndices({viewState: coarseFrame, minZoom: 0, maxZoom: 0, zRange: null})
  ).toEqual([{x: 0, y: 0, z: 0, tileMatrix: '1'}]);
  tileset.setOptions({extent: [108, 196, 109, 200]});
  expect(tileset.getTileIndices({viewState: FRAME, zRange: null})).toEqual([]);
  tileset.setOptions({extent: [101, 199, 101, 199]});
  expect(tileset.getTileIndices({viewState: FRAME, zRange: null})).toHaveLength(1);
  tileset.setOptions({extent: [1, 2, 3]});
  expect(() => tileset.getTileIndices({viewState: FRAME, zRange: null})).toThrow('extent');
  tileset.finalize();
});

test('zoom offset scales sampling resolution while preserving original native level indices', () => {
  const adapter = createTileMatrixTileset2DAdapter(
    {tileMatrixSet: GRID.tileMatrixSet},
    {cacheNamespace: 'zoom'}
  );
  const context = {viewState: {...FRAME, resolution: 4}, tileSize: 256};
  expect(adapter.getTileIndices(context).map(index => index.tileMatrix)).toEqual(['1']);
  expect(
    adapter.getTileIndices({...context, zoomOffset: 1}).map(index => [index.tileMatrix, index.z])
  ).toEqual([
    ['detail', 1],
    ['detail', 1]
  ]);
  expect(
    adapter.getTileIndices({...context, minZoom: 1, maxZoom: 1}).map(index => index.z)
  ).toEqual([1, 1]);
  expect(adapter.getTileIndices({...context, minZoom: 3})).toEqual([]);
  expect(() => adapter.getTileIndices({...context, zoomOffset: 0.5})).toThrow('integer');
  expect(() => adapter.getTileIndices({...context, zoomOffset: 2000})).toThrow('resolution');
  expect(() => adapter.getTileIndices({...context, minZoom: Infinity})).toThrow('finite');
});

test('native-frame traversal rejects unsupported model transforms and elevation clipping', () => {
  const adapter = createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'transform'});
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const context = {viewState: FRAME, tileSize: 256};
  expect(
    adapter.getTileIndices({...context, modelMatrix: identity, modelMatrixInverse: identity})
  ).toHaveLength(2);
  expect(() =>
    adapter.getTileIndices({...context, modelMatrix: [...identity.slice(0, 12), 1, 0, 0, 1]})
  ).toThrow('already-transformed');
  expect(() => adapter.getTileIndices({...context, modelMatrixInverse: [1]})).toThrow(
    'already-transformed'
  );
  expect(() => adapter.getTileIndices({...context, zRange: [0, 10]})).toThrow('elevation-aware');
  expect(() =>
    adapter.getTileIndices({...context, viewState: {...FRAME, resolution: 0}, extent: [0, 0, 1, 1]})
  ).toThrow('resolution');
});

test('source geographic metadata bounds do not clip a projected native frame', async () => {
  const source = {
    getMetadata: async () => ({
      boundingBox: [
        [1, 2],
        [3, 4]
      ]
    }),
    getTileData: async () => null
  };
  const adapter = createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'projected'});
  const tileset = new Tileset2D({tileSource: source as any, adapter});
  await Promise.resolve();
  await Promise.resolve();
  expect(tileset.sourceMetadata?.boundingBox).toEqual([
    [1, 2],
    [3, 4]
  ]);
  expect(tileset.getTileIndices({viewState: FRAME, zRange: null})).toHaveLength(2);
  tileset.finalize();
});

test('source-switch unload callbacks see the old tile but may safely reselect with the new source', async () => {
  const adapter = createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'reentrant'});
  const oldSource = {getMetadata: async () => ({}), getTileData: async () => 'old'};
  const newSource = {getMetadata: async () => ({}), getTileData: async () => 'new'};
  let replacement: ReturnType<Tileset2D['getTile']>;
  let tileset: Tileset2D<any, TileMatrixViewFrame>;
  tileset = new Tileset2D({
    tileSource: oldSource as any,
    adapter,
    onTileUnload: () => {
      const [index] = tileset.getTileIndices({viewState: FRAME, zRange: null});
      replacement = tileset.getTile(index, true);
    }
  });
  const [index] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const oldTile = tileset.getTile(index, true);
  await oldTile.data;
  tileset.setOptions({tileSource: newSource as any, onTileUnload: () => {}});
  expect(replacement!).not.toBe(oldTile);
  expect(await replacement!.data).toBe('new');
  expect(tileset.getTile(index)).toBe(replacement);
  tileset.finalize();
});

test('malformed and sparse extents reject rather than yielding an empty selection', () => {
  const adapter = createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'extent'});
  expect(() =>
    adapter.getTileIndices({viewState: {...FRAME, extent: new Array(4) as any}, tileSize: 256})
  ).toThrow('extent');
  const tileset = new Tileset2D({adapter, getTileData: () => null, extent: new Array(4)});
  expect(() => tileset.getTileIndices({viewState: FRAME, zRange: null})).toThrow('extent');
  tileset.finalize();
});

test('superseded requests deliver discarded content without overwriting the new tile', async () => {
  let resolveOld!: (value: string) => void;
  let resolveStarted!: () => void;
  const started = new Promise<void>(resolve => {
    resolveStarted = resolve;
  });
  const oldData = new Promise<string>(resolve => {
    resolveOld = resolve;
  });
  let requests = 0;
  const discarded: string[] = [];
  const tileset = new Tileset2D({
    adapter: createTileMatrixTileset2DAdapter(GRID, {cacheNamespace: 'reload'}),
    getTileData: () => (++requests === 1 ? (resolveStarted(), oldData) : 'new'),
    onTileDiscard: (_tile, content) => discarded.push(content)
  });
  const listenerDiscards: string[] = [];
  tileset.subscribe({onTileDiscard: (_tile, content) => listenerDiscards.push(content)});
  const [index] = tileset.getTileIndices({viewState: FRAME, zRange: null});
  const tile = tileset.getTile(index, true);
  await started;
  const oldLoad = tile.data as Promise<unknown>;
  tile.setNeedsReload();
  tileset.getTile(index, true);
  expect(await tile.data).toBe('new');
  resolveOld('stale');
  await oldLoad;
  expect(tile.content).toBe('new');
  expect(discarded).toEqual(['stale']);
  expect(listenerDiscards).toEqual(['stale']);
  tileset.finalize();
});
