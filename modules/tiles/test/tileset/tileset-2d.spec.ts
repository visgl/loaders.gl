// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('Tileset2D#applies TileSource metadata overrides', async t => {
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
  t.equal(tileset.minZoom, 2);
  t.equal(tileset.maxZoom, 5);
  const indices = tileset.getTileIndices({viewState: null, zRange: null});
  t.equal(indices.length, 2);
  tileset.finalize();
  t.end();
});

test('Tileset2D#tracks consumer visibility unions', async t => {
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

  t.equal(tileset.selectedTiles.length, 2);
  t.equal(tileset.visibleTiles.length, 2);

  tileset.detachConsumer(secondConsumer);
  t.equal(tileset.selectedTiles.length, 1);
  t.equal(tileset.visibleTiles.length, 1);

  tileset.finalize();
  t.end();
});

test('Tileset2D#reloadAll keeps selected tiles and drops unused cached tiles', async t => {
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

  t.ok(tileset.getTile(firstTile.index));
  t.ok(tileset.getTile(firstTile.index)?.needsReload);
  t.notOk(tileset.getTile(secondTile.index));

  tileset.finalize();
  t.end();
});

test('Tileset2D#caches failed tiles until reloadAll', async t => {
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

  t.equal(requestCount, 1, 'first request failed once');
  t.ok(failedTile.hasError, 'failed tile stores its error');
  t.equal(failedTile.error?.message, 'boom', 'failed tile stores the error message');
  t.equal(failedTile.content, null, 'failed tile keeps null content');

  const cachedTile = tileset.getTile(firstIndex, true);
  await cachedTile.data;
  t.equal(requestCount, 1, 'cached failed tile is not re-requested immediately');
  t.ok(cachedTile.hasError, 'cached failed tile remains failed');

  tileset.reloadAll();
  const reloadedTile = tileset.getTile(firstIndex, true);
  await reloadedTile.data;
  t.equal(requestCount, 2, 'reloadAll allows failed tiles to be requested again');

  tileset.finalize();
  t.end();
});
