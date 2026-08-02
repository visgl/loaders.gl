// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {coreApi} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {getI3sTileHeader} from '@loaders.gl/i3s/test/test-utils/load-utils';
import {I3SSource, Tile3D, Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import type {Tileset3DProps} from '../../src/tileset-3d/common/tileset-3d';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/Tileset/tileset.json';
const BYTES_PER_MEBIBYTE = 1024 * 1024;

/**
 * Creates a source-backed test tileset with the requested cache options.
 * @param options - Runtime options under test.
 * @returns A tileset whose initialization can be awaited by the test.
 */
function createTestTileset(options: Tileset3DProps = {}): Tileset3D {
  const source = new Tiles3DSource({url: TILESET_URL, loader: Tiles3DLoader, coreApi});
  return new Tileset3D(source, options);
}

test('Tileset3D#cache byte budgets use Cesium-compatible defaults', async t => {
  const tileset = createTestTileset();
  await tileset.tilesetInitializationPromise;

  t.equals(tileset.cacheBytes, 512 * BYTES_PER_MEBIBYTE, 'defaults to a 512 MiB cache');
  t.equals(
    tileset.maximumCacheOverflowBytes,
    512 * BYTES_PER_MEBIBYTE,
    'defaults to 512 MiB of current-view headroom'
  );
  t.equals(
    tileset.options.memoryAdjustedScreenSpaceError,
    true,
    'memory-adjusted SSE is enabled by default'
  );
  t.end();
});

test('Tileset3D#cache defaults leave I3S behavior unchanged', async t => {
  const i3sTilesetHeader = await getI3sTileHeader();
  const tileset = new Tileset3D(new I3SSource({...i3sTilesetHeader, coreApi}));
  await tileset.tilesetInitializationPromise;

  t.equals(tileset.cacheBytes, 32 * BYTES_PER_MEBIBYTE, 'retains the 32 MiB I3S cache');
  t.equals(
    tileset.maximumCacheOverflowBytes,
    BYTES_PER_MEBIBYTE,
    'retains the 1 MiB I3S overflow window'
  );
  t.equals(
    tileset.options.memoryAdjustedScreenSpaceError,
    false,
    'does not enable adaptive I3S LOD by default'
  );
  t.end();
});

test('Tileset3D#cache byte options take precedence over deprecated MiB options', async t => {
  const tileset = createTestTileset({
    cacheBytes: 1234,
    maximumCacheOverflowBytes: 5678,
    maximumMemoryUsage: 2,
    memoryCacheOverflow: 3
  });
  await tileset.tilesetInitializationPromise;

  t.equals(tileset.cacheBytes, 1234, 'uses the byte-native cache target exactly');
  t.equals(tileset.maximumCacheOverflowBytes, 5678, 'uses the byte-native overflow value exactly');
  t.equals(
    tileset.maximumMemoryUsage,
    1234 / BYTES_PER_MEBIBYTE,
    'keeps the deprecated property synchronized'
  );
  t.equals(
    tileset.options.memoryCacheOverflow,
    5678 / BYTES_PER_MEBIBYTE,
    'keeps the deprecated option synchronized'
  );
  t.end();
});

test('Tileset3D#deprecated MiB cache options remain compatible', async t => {
  const tileset = createTestTileset({maximumMemoryUsage: 2, memoryCacheOverflow: 3});
  await tileset.tilesetInitializationPromise;

  t.equals(tileset.cacheBytes, 2 * BYTES_PER_MEBIBYTE, 'converts the base budget to bytes');
  t.equals(
    tileset.maximumCacheOverflowBytes,
    3 * BYTES_PER_MEBIBYTE,
    'converts overflow headroom to bytes'
  );

  tileset.maximumMemoryUsage = 4;
  t.equals(tileset.cacheBytes, 4 * BYTES_PER_MEBIBYTE, 'synchronizes legacy assignments');
  t.equals(tileset.options.cacheBytes, 4 * BYTES_PER_MEBIBYTE, 'synchronizes public options');
  t.end();
});

test('Tileset3D#setProps updates byte budgets without stale derived state', async t => {
  const tileset = createTestTileset({cacheBytes: 100, maximumCacheOverflowBytes: 20});
  await tileset.tilesetInitializationPromise;

  tileset.setProps({maximumMemoryUsage: 2, maximumCacheOverflowBytes: 30});
  t.equals(tileset.cacheBytes, 2 * BYTES_PER_MEBIBYTE, 'updates from the deprecated base option');
  t.equals(tileset.maximumCacheOverflowBytes, 30, 'updates the byte-native overflow option');

  tileset.setProps({cacheBytes: 40, maximumMemoryUsage: 9, memoryCacheOverflow: 4});
  t.equals(tileset.cacheBytes, 40, 'byte-native base option wins during runtime updates');
  t.equals(
    tileset.maximumCacheOverflowBytes,
    4 * BYTES_PER_MEBIBYTE,
    'an independently supplied legacy overflow option still converts correctly'
  );
  t.end();
});

test('Tileset3D#cache byte budgets reject unstable thresholds', async t => {
  t.throws(
    () => createTestTileset({cacheBytes: -1}),
    /cacheBytes must be a finite number greater than or equal to 0/,
    'rejects negative construction values'
  );
  t.throws(
    () => createTestTileset({maximumCacheOverflowBytes: Number.POSITIVE_INFINITY}),
    /maximumCacheOverflowBytes must be a finite number greater than or equal to 0/,
    'rejects infinite construction values'
  );

  const tileset = createTestTileset();
  await tileset.tilesetInitializationPromise;
  t.throws(() => {
    tileset.cacheBytes = Number.NaN;
  }, /cacheBytes must be a finite number greater than or equal to 0/);
  t.throws(() => {
    tileset.maximumMemoryUsage = -1;
  }, /maximumMemoryUsage must be a finite number greater than or equal to 0/);
  t.end();
});

test('Tileset3D#memory-adjusted SSE uses base plus overflow as its pressure ceiling', async t => {
  const tileset = createTestTileset({
    cacheBytes: 100,
    maximumCacheOverflowBytes: 20,
    maximumScreenSpaceError: 10
  });
  await tileset.tilesetInitializationPromise;

  tileset.gpuMemoryUsageInBytes = 120;
  tileset.adjustScreenSpaceError();
  t.equals(
    tileset.memoryAdjustedScreenSpaceError,
    10,
    'does not adjust inside the overflow window'
  );

  tileset.gpuMemoryUsageInBytes = 121;
  tileset.adjustScreenSpaceError();
  t.equals(tileset.memoryAdjustedScreenSpaceError, 10.2, 'reduces LOD demand above the ceiling');

  tileset.gpuMemoryUsageInBytes = 99;
  tileset.adjustScreenSpaceError();
  t.equals(tileset.memoryAdjustedScreenSpaceError, 10, 'restores the configured SSE below base');
  t.end();
});

test('TilesetCache#unloadTiles evicts by exact bytes and protects current-frame tiles', async t => {
  const tileset = createTestTileset({cacheBytes: 150});
  await tileset.tilesetInitializationPromise;

  const firstTile = {_cacheNode: null} as Tile3D;
  const secondTile = {_cacheNode: null} as Tile3D;
  const protectedTile = {_cacheNode: null} as Tile3D;
  const unloadedTiles: Tile3D[] = [];

  tileset._cache.add(tileset, firstTile);
  tileset._cache.add(tileset, secondTile);
  tileset._cache.add(tileset, protectedTile);
  tileset._cache.reset();
  tileset._cache.touch(protectedTile);
  tileset.gpuMemoryUsageInBytes = 300;

  tileset._cache.unloadTiles(tileset, (_tileset, tile) => {
    unloadedTiles.push(tile);
    tileset.gpuMemoryUsageInBytes -= 100;
  });

  t.deepEquals(unloadedTiles, [firstTile, secondTile], 'evicts eligible tiles in LRU order');
  t.equals(tileset.gpuMemoryUsageInBytes, 100, 'stops after reaching the exact byte target');
  t.ok(protectedTile._cacheNode, 'retains the tile touched in the current frame');
  t.end();
});
