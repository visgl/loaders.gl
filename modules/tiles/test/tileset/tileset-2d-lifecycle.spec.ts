// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Tileset2D, type Tileset2DAdapter} from '@loaders.gl/tiles';

/** Minimal renderer-independent traversal adapter for cache lifecycle tests. */
const TEST_ADAPTER: Tileset2DAdapter<null> = {
  getTileIndices: () => [],
  getTileBoundingBox: (_context, index) => ({
    west: index.x,
    east: index.x + 1,
    south: index.y,
    north: index.y + 1
  })
};

/** Initializes traversal metadata without creating a viewport or rendering context. */
function prepareTileset<DataT>(tileset: Tileset2D<DataT, null>): void {
  tileset.getTileIndices({viewState: null, zRange: null});
}

/** Creates a request whose completion is explicitly controlled by the test. */
function createDeferred<ValueT>() {
  let resolve!: (value: ValueT) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<ValueT>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
}

test('reload retains visible fallback content and overlapping consumers', async () => {
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: async () => ({byteLength: 4}),
    maxCacheSize: 1
  });
  prepareTileset(tileset);
  const parent = tileset.getTile({x: 0, y: 0, z: 0}, true);
  const child = tileset.getTile({x: 0, y: 0, z: 1}, true);
  const first = Symbol('first');
  const second = Symbol('second');
  tileset.updateConsumer(first, [child], [parent]);
  tileset.updateConsumer(second, [child], [parent]);
  expect(tileset.stats.get('Visible Tiles').count).toBe(2);
  expect(tileset.stats.get('Loading Tiles').count).toBe(2);
  await Promise.all([parent.data, child.data]);
  tileset.detachConsumer(first);
  expect(tileset.stats.get('Tiles In Cache').count).toBe(2);
  expect(tileset.cacheByteSize).toBe(8);
  tileset.reloadAll();
  expect(parent.needsReload).toBe(true);
  expect(child.needsReload).toBe(true);
  expect(parent.content).toEqual({byteLength: 4});
  expect(tileset.getTile(parent.index)).toBe(parent);
  expect(tileset.stats.get('Visible Tiles').count).toBe(2);
  expect(tileset.stats.get('Loading Tiles').count).toBe(0);
  tileset.detachConsumer(second);
  expect(tileset.stats.get('Tiles In Cache').count).toBe(1);
  expect(tileset.stats.get('Unloaded Tiles').count).toBe(1);
  tileset.finalize();
});

test('tree rebuild preserves LRU order and batch eviction scans no bytes per tile', async () => {
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: async () => ({byteLength: 4})
  });
  prepareTileset(tileset);
  const parent = tileset.getTile({x: 0, y: 0, z: 0}, true);
  const children = Array.from({length: 8}, (_, index) =>
    tileset.getTile({x: index, y: 0, z: 3}, true)
  );
  await Promise.all([parent.data, ...children.map(tile => tile.data)]);
  const byteScans = vi.spyOn(tileset as any, '_getCacheByteSize');
  const statsScans = vi.spyOn(tileset as any, '_updateStats');
  const snapshots: number[] = [];
  const unloaded: string[] = [];
  tileset.subscribe({
    onStatsChange: stats => snapshots.push(stats.get('Cache Size').count),
    onTileUnload: tile => unloaded.push(tile.id)
  });
  tileset.prepareTiles();
  expect(children[0].parent).toBe(parent);
  expect(statsScans).not.toHaveBeenCalled();
  tileset.setOptions({maxCacheSize: 2, maxCacheByteSize: 4});
  tileset.updateConsumer(Symbol('empty'), [], []);
  expect(unloaded).toEqual([parent.id, ...children.slice(0, -1).map(tile => tile.id)]);
  expect(tileset.tiles).toEqual([children.at(-1)]);
  expect(byteScans).not.toHaveBeenCalled();
  expect(statsScans).toHaveBeenCalledTimes(1);
  expect(snapshots).toEqual([4]);
  expect(tileset.stats.get('Unloaded Tiles').count).toBe(8);
  tileset.finalize();
});

test('tile requests update counters immediately and coalesce scans and notifications', async () => {
  const result = createDeferred<null>();
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    maxRequests: 0,
    getTileData: () => result.promise
  });
  prepareTileset(tileset);
  const statsScans = vi.spyOn(tileset as any, '_updateStats');
  const notify = vi.fn();
  tileset.subscribe({onStatsChange: notify});
  const tiles = Array.from({length: 20}, (_, index) =>
    tileset.getTile({x: index, y: 0, z: 5}, true)
  );
  expect(tileset.stats.get('Tiles In Cache').count).toBe(20);
  expect(tileset.stats.get('Loading Tiles').count).toBe(20);
  expect(statsScans).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(statsScans).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledTimes(1);
  tileset.prepareTiles();
  for (const tile of tiles) {
    expect(tileset.getTile(tile.index)).toBe(tile);
  }
  expect(statsScans).toHaveBeenCalledTimes(1);
  result.resolve(null);
  await Promise.all(tiles.map(tile => tile.data));
  expect(tileset.stats.get('Loading Tiles').count).toBe(0);
  tileset.finalize();
});

test.each([
  'evict',
  'finalize'
] as const)('%s aborts requests and ignores late successful or failed completions', async action => {
  const success = createDeferred<{byteLength: number}>();
  const failure = createDeferred<never>();
  const signals: AbortSignal[] = [];
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    maxRequests: 0,
    getTileData: ({index, signal}) => {
      signals.push(signal!);
      return index.x === 0 ? success.promise : failure.promise;
    }
  });
  prepareTileset(tileset);
  const first = tileset.getTile({x: 0, y: 0, z: 1}, true);
  const second = tileset.getTile({x: 1, y: 0, z: 1}, true);
  const pending = Promise.all([first.data, second.data]);
  await Promise.resolve();
  expect(signals).toHaveLength(2);
  const notify = vi.fn();
  tileset.subscribe({onTileLoad: notify, onTileError: notify, onStatsChange: notify});
  if (action === 'evict') {
    tileset.setOptions({maxCacheSize: 0});
    tileset.updateConsumer(Symbol('empty'), [], []);
    expect(tileset.stats.get('Unloaded Tiles').count).toBe(2);
  } else {
    tileset.finalize();
  }
  expect(signals.every(signal => signal.aborted)).toBe(true);
  expect(tileset.stats.get('Loading Tiles').count).toBe(0);
  notify.mockClear();
  success.resolve({byteLength: 50});
  failure.reject(new Error('late failure'));
  await pending;
  expect(notify).not.toHaveBeenCalled();
  expect(first.content).toBe(null);
  expect(second.error).toBe(null);
  expect(tileset.cacheByteSize).toBe(0);
  expect(tileset.stats.get('Tiles In Cache').count).toBe(0);
  tileset.finalize();
});

test('finalization suppresses pending metadata notifications', async () => {
  const metadata = createDeferred<{minZoom: number}>();
  const tileset = Tileset2D.fromTileSource({
    getMetadata: () => metadata.promise,
    getTile: async () => null,
    getTileData: async () => null
  });
  const notify = vi.fn();
  tileset.subscribe({onUpdate: notify, onError: notify, onStatsChange: notify});
  tileset.finalize();
  notify.mockClear();
  metadata.resolve({minZoom: 12});
  await metadata.promise;
  expect(tileset.sourceMetadata).toBe(null);
  expect(notify).not.toHaveBeenCalled();
});

test('a failed reload releases stale content bytes and reports settled statistics', async () => {
  const getData = vi.fn().mockResolvedValueOnce({byteLength: 12}).mockRejectedValueOnce('failed');
  const tileset = new Tileset2D({adapter: TEST_ADAPTER, getTileData: getData});
  prepareTileset(tileset);
  const tile = tileset.getTile({x: 0, y: 0, z: 0}, true);
  tileset.updateConsumer(Symbol('view'), [tile], []);
  await tile.data;
  expect(tileset.cacheByteSize).toBe(12);
  const snapshots: number[] = [];
  tileset.subscribe({onTileError: () => snapshots.push(tileset.stats.get('Cache Size').count)});
  tileset.reloadAll();
  await tileset.getTile(tile.index, true).data;
  expect(tile.hasError).toBe(true);
  expect(snapshots).toEqual([0]);
  expect(tileset.cacheByteSize).toBe(0);
  expect(tileset.stats.get('Loading Tiles').count).toBe(0);
  tileset.finalize();
});

test('finalization before scheduling prevents queued loaders and later notifications', async () => {
  const getData = vi.fn().mockResolvedValue(null);
  const tileset = new Tileset2D({adapter: TEST_ADAPTER, getTileData: getData});
  prepareTileset(tileset);
  const tile = tileset.getTile({x: 0, y: 0, z: 0}, true);
  const pending = tile.data;
  tileset.finalize();
  const notify = vi.fn();
  tileset.subscribe({onStatsChange: notify, onTileLoad: notify});
  await pending;
  expect(getData).not.toHaveBeenCalled();
  expect(notify).not.toHaveBeenCalled();
});

test('a superseded load cannot overwrite a replacement request for the same tile', async () => {
  const stale = createDeferred<{byteLength: number}>();
  const getData = vi
    .fn()
    .mockImplementationOnce(() => stale.promise)
    .mockResolvedValueOnce({byteLength: 8});
  const tileset = new Tileset2D({adapter: TEST_ADAPTER, getTileData: getData, maxRequests: 0});
  prepareTileset(tileset);
  const tile = tileset.getTile({x: 0, y: 0, z: 0}, true);
  const original = tile.data;
  tileset.updateConsumer(Symbol('view'), [tile], []);
  await Promise.resolve();
  expect(getData).toHaveBeenCalledTimes(1);
  tileset.reloadAll();
  await tileset.getTile(tile.index, true).data;
  expect(tile.content).toEqual({byteLength: 8});
  stale.resolve({byteLength: 100});
  await original;
  expect(tile.content).toEqual({byteLength: 8});
  expect(tileset.cacheByteSize).toBe(8);
  expect(tileset.stats.get('Loading Tiles').count).toBe(0);
  tileset.finalize();
});

test('an aborted request keeps its concurrency slot until the loader settles', async () => {
  const stale = createDeferred<null>();
  const replacement = createDeferred<null>();
  const getData = vi
    .fn()
    .mockImplementationOnce(() => stale.promise)
    .mockImplementationOnce(() => replacement.promise)
    .mockResolvedValue(null);
  const tileset = new Tileset2D({adapter: TEST_ADAPTER, getTileData: getData, maxRequests: 1});
  prepareTileset(tileset);
  const tile = tileset.getTile({x: 0, y: 0, z: 1}, true);
  const consumer = Symbol('view');
  tileset.updateConsumer(consumer, [tile], []);
  await vi.waitFor(() => expect(getData).toHaveBeenCalledTimes(1));
  tileset.reloadAll();
  const refreshed = tileset.getTile(tile.index, true).data;
  stale.resolve(null);
  await vi.waitFor(() => expect(getData).toHaveBeenCalledTimes(2));
  const other = tileset.getTile({x: 1, y: 0, z: 1}, true);
  tileset.updateConsumer(consumer, [tile, other], []);
  // Flush scheduling while the replacement loader still occupies the single slot.
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(getData).toHaveBeenCalledTimes(2);
  replacement.resolve(null);
  await Promise.all([refreshed, other.data]);
  expect(getData).toHaveBeenCalledTimes(3);
  tileset.finalize();
});
