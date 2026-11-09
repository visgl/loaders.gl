import {expect, test} from 'vitest';
import {Tileset2D, type Tileset2DAdapter} from '@loaders.gl/tiles';
const TEST_ADAPTER: Tileset2DAdapter<null> = {
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
test('Tileset2D#applies TileSource metadata overrides', async () => {
  const tileset = Tileset2D.fromTileSource(
    {
      async getMetadata() {
        return {
          minZoom: 2,
          maxZoom: 5,
          boundingBox: [
            [1, 2],
            [3, 4]
          ]
        };
      },
      async getTileData() {
        return [];
      }
    } as any,
    {adapter: TEST_ADAPTER}
  );
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(tileset.minZoom).toBe(2);
  expect(tileset.maxZoom).toBe(5);
  const indices = tileset.getTileIndices({viewState: null, zRange: null});
  expect(indices.length).toBe(2);
  tileset.finalize();
});
test('Tileset2D#tracks consumer visibility unions', async () => {
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: async () => ({byteLength: 1})
  });
  const indices = tileset.getTileIndices({viewState: null, zRange: null});
  const firstTile = tileset.getTile(indices[0], true);
  const secondTile = tileset.getTile(indices[1], true);
  await Promise.all([firstTile.data, secondTile.data]);
  tileset.prepareTiles();
  const firstConsumer = Symbol('first');
  const secondConsumer = Symbol('second');
  tileset.attachConsumer(firstConsumer);
  tileset.attachConsumer(secondConsumer);
  tileset.updateConsumer(firstConsumer, [firstTile], [firstTile]);
  tileset.updateConsumer(secondConsumer, [secondTile], []);
  expect(tileset.selectedTiles.length).toBe(2);
  expect(tileset.visibleTiles.length).toBe(2);
  tileset.detachConsumer(secondConsumer);
  expect(tileset.selectedTiles.length).toBe(1);
  expect(tileset.visibleTiles.length).toBe(1);
  tileset.finalize();
});
test('Tileset2D#reloadAll keeps selected tiles and drops unused cached tiles', async () => {
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: async ({id}) => ({id, byteLength: 1})
  });
  const indices = tileset.getTileIndices({viewState: null, zRange: null});
  const firstTile = tileset.getTile(indices[0], true);
  const secondTile = tileset.getTile(indices[1], true);
  await Promise.all([firstTile.data, secondTile.data]);
  tileset.prepareTiles();
  const consumerId = Symbol('consumer');
  tileset.attachConsumer(consumerId);
  tileset.updateConsumer(consumerId, [firstTile], [firstTile]);
  tileset.reloadAll();
  expect(tileset.getTile(firstTile.index)).toBeTruthy();
  expect(tileset.getTile(firstTile.index)?.needsReload).toBeTruthy();
  expect(tileset.getTile(secondTile.index)).toBeFalsy();
  expect(
    tileset.tiles.some(tile => tile.id === secondTile.id),
    'removed tiles no longer remain in the prepared tile list'
  ).toBeFalsy();
  tileset.finalize();
});
test('Tileset2D#setOptions recreates the request scheduler when throttling changes', () => {
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: async () => null,
    maxRequests: 4,
    debounceTime: 0
  });
  const initialScheduler = (tileset as any)._requestScheduler;
  tileset.setOptions({maxRequests: 2});
  const updatedScheduler = (tileset as any)._requestScheduler;
  expect(updatedScheduler, 'scheduler recreated for maxRequests updates').not.toBe(
    initialScheduler
  );
  tileset.setOptions({tileSize: 512});
  expect(
    (tileset as any)._requestScheduler,
    'scheduler is reused when throttling options are unchanged'
  ).toBe(updatedScheduler);
  tileset.setOptions({debounceTime: 10});
  expect(
    (tileset as any)._requestScheduler,
    'scheduler recreated for debounceTime updates'
  ).not.toBe(updatedScheduler);
  tileset.finalize();
});
test('Tileset2D#caches failed tiles until reloadAll', async () => {
  let requestCount = 0;
  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: async () => {
      requestCount++;
      throw new Error('boom');
    }
  });
  const [firstIndex] = tileset.getTileIndices({viewState: null, zRange: null});
  const failedTile = tileset.getTile(firstIndex, true);
  await failedTile.data;
  expect(requestCount, 'first request failed once').toBe(1);
  expect(failedTile.hasError, 'failed tile stores its error').toBeTruthy();
  expect(failedTile.error?.message, 'failed tile stores the error message').toBe('boom');
  expect(failedTile.content, 'failed tile keeps null content').toBe(null);
  const cachedTile = tileset.getTile(firstIndex, true);
  await cachedTile.data;
  expect(requestCount, 'cached failed tile is not re-requested immediately').toBe(1);
  expect(cachedTile.hasError, 'cached failed tile remains failed').toBeTruthy();
  tileset.reloadAll();
  const reloadedTile = tileset.getTile(firstIndex, true);
  await reloadedTile.data;
  expect(requestCount, 'reloadAll allows failed tiles to be requested again').toBe(2);
  tileset.finalize();
});

test('Tileset2D validates traversal setup and derives tile identity metadata', () => {
  expect(() => new Tileset2D({} as any)).toThrow('requires either');
  const withoutAdapter = new Tileset2D({getTileData: () => null});
  expect(() => withoutAdapter.getTileIndices({viewState: null, zRange: null})).toThrow(
    'requires an adapter'
  );
  expect(() => withoutAdapter.getTileMetadata({x: 0, y: 0, z: 0})).toThrow(
    'before traversal context'
  );
  withoutAdapter.finalize();

  const tileset = new Tileset2D({
    adapter: TEST_ADAPTER,
    getTileData: () => null,
    minZoom: 1.2,
    maxZoom: 4.8,
    extent: [1, 2, 3]
  });
  expect(tileset.minZoom).toBe(2);
  expect(tileset.maxZoom).toBe(4);
  expect(tileset.refinementStrategy).toBe('best-available');
  expect(tileset.adapter).toBe(TEST_ADAPTER);
  expect(tileset.getTileId({x: 2, y: 3, z: 4})).toBe('2-3-4');
  expect(tileset.getTileZoom({x: 2, y: 3, z: 4})).toBe(4);
  expect(tileset.getParentIndex({x: 3, y: 5, z: 4})).toEqual({x: 1, y: 2, z: 3});
  tileset.getTileIndices({viewState: null, zRange: null});
  expect(tileset.getTileMetadata({x: 2, y: 3, z: 4})).toEqual({
    bbox: {west: 2, south: 3, east: 3, north: 4}
  });
  expect(tileset.getTile({x: 9, y: 9, z: 9})).toBeUndefined();
  tileset.finalize();
});

test('Tileset2D emits listener callbacks and honors explicit metadata overrides', async () => {
  const events: string[] = [];
  const tileset = Tileset2D.fromTileSource(
    {
      async getMetadata() {
        return {
          minZoom: 2,
          maxZoom: 9,
          boundingBox: [
            [1, 2],
            [3, 4]
          ]
        };
      },
      async getTileData() {
        return {byteLength: 5};
      }
    } as any,
    {adapter: TEST_ADAPTER, minZoom: 4, maxCacheSize: 0}
  );
  const unsubscribe = tileset.subscribe({
    onUpdate: () => events.push('update'),
    onTileLoad: () => events.push('load'),
    onTileUnload: () => events.push('unload'),
    onTileError: () => events.push('tile-error'),
    onError: () => events.push('source-error'),
    onStatsChange: () => events.push('stats')
  });
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(tileset.minZoom).toBe(4);
  expect(tileset.maxZoom).toBe(9);
  expect(events).toContain('update');

  const [index] = tileset.getTileIndices({viewState: null, zRange: null});
  const tile = tileset.getTile(index, true);
  await tile.data;
  expect(events).toContain('load');
  (tileset as any)._resizeCache();
  expect(events).toContain('unload');
  unsubscribe();
  const eventCount = events.length;
  (tileset as any)._notifyUpdate();
  expect(events).toHaveLength(eventCount);
  tileset.finalize();
});

test('Tileset2D reports non-Error metadata failures and rebuilds ancestor links', async () => {
  const errors: Error[] = [];
  const failingTileset = Tileset2D.fromTileSource(
    {
      async getMetadata() {
        throw 'offline';
      },
      getTileData() {
        return null;
      }
    } as any,
    {adapter: TEST_ADAPTER}
  );
  failingTileset.subscribe({onError: error => errors.push(error)});
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(errors[0].message).toContain('offline');
  expect((failingTileset as any)._getMetadataOverrides(null)).toEqual({});
  failingTileset.finalize();

  const tileset = new Tileset2D({adapter: TEST_ADAPTER, getTileData: () => ({byteLength: 1})});
  tileset.getTileIndices({viewState: null, zRange: null});
  const parent = tileset.getTile({x: 0, y: 0, z: 0}, true);
  const child = tileset.getTile({x: 1, y: 1, z: 1}, true);
  const grandchild = tileset.getTile({x: 3, y: 3, z: 2}, true);
  await Promise.all([parent.data, child.data, grandchild.data]);
  tileset.prepareTiles();
  expect(child.parent).toBe(parent);
  expect(grandchild.parent).toBe(child);
  expect(tileset.tiles.map(tile => tile.zoom)).toEqual([0, 1, 2]);
  expect(tileset.cacheByteSize).toBe(3);
  expect(tileset.unloadedTiles).toHaveLength(0);
  tileset.finalize();
  expect(tileset.tiles).toEqual([]);
  expect(tileset.cacheByteSize).toBe(0);
});
