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
