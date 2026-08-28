// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
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
test('Tileset3D#cache byte budgets use Cesium-compatible defaults', async () => {
  const tileset = createTestTileset();
  await tileset.tilesetInitializationPromise;
  expect(tileset.cacheBytes, 'defaults to a 512 MiB cache').toBe(512 * BYTES_PER_MEBIBYTE);
  expect(tileset.maximumCacheOverflowBytes, 'defaults to 512 MiB of current-view headroom').toBe(
    512 * BYTES_PER_MEBIBYTE
  );
  expect(
    tileset.options.memoryAdjustedScreenSpaceError,
    'memory-adjusted SSE is enabled by default'
  ).toBe(true);
});
test('Tileset3D#cache defaults leave I3S behavior unchanged', async () => {
  const i3sTilesetHeader = await getI3sTileHeader();
  const tileset = new Tileset3D(new I3SSource({...i3sTilesetHeader, coreApi}));
  await tileset.tilesetInitializationPromise;
  expect(tileset.cacheBytes, 'retains the 32 MiB I3S cache').toBe(32 * BYTES_PER_MEBIBYTE);
  expect(tileset.maximumCacheOverflowBytes, 'retains the 1 MiB I3S overflow window').toBe(
    BYTES_PER_MEBIBYTE
  );
  expect(
    tileset.options.memoryAdjustedScreenSpaceError,
    'does not enable adaptive I3S LOD by default'
  ).toBe(false);
});
test('Tileset3D#cache byte options take precedence over deprecated MiB options', async () => {
  const tileset = createTestTileset({
    cacheBytes: 1234,
    maximumCacheOverflowBytes: 5678,
    maximumMemoryUsage: 2,
    memoryCacheOverflow: 3
  });
  await tileset.tilesetInitializationPromise;
  expect(tileset.cacheBytes, 'uses the byte-native cache target exactly').toBe(1234);
  expect(tileset.maximumCacheOverflowBytes, 'uses the byte-native overflow value exactly').toBe(
    5678
  );
  expect(tileset.maximumMemoryUsage, 'keeps the deprecated property synchronized').toBe(
    1234 / BYTES_PER_MEBIBYTE
  );
  expect(tileset.options.memoryCacheOverflow, 'keeps the deprecated option synchronized').toBe(
    5678 / BYTES_PER_MEBIBYTE
  );
});
test('Tileset3D#deprecated MiB cache options remain compatible', async () => {
  const tileset = createTestTileset({maximumMemoryUsage: 2, memoryCacheOverflow: 3});
  await tileset.tilesetInitializationPromise;
  expect(tileset.cacheBytes, 'converts the base budget to bytes').toBe(2 * BYTES_PER_MEBIBYTE);
  expect(tileset.maximumCacheOverflowBytes, 'converts overflow headroom to bytes').toBe(
    3 * BYTES_PER_MEBIBYTE
  );
  tileset.maximumMemoryUsage = 4;
  expect(tileset.cacheBytes, 'synchronizes legacy assignments').toBe(4 * BYTES_PER_MEBIBYTE);
  expect(tileset.options.cacheBytes, 'synchronizes public options').toBe(4 * BYTES_PER_MEBIBYTE);
});
test('Tileset3D#setProps updates byte budgets without stale derived state', async () => {
  const tileset = createTestTileset({cacheBytes: 100, maximumCacheOverflowBytes: 20});
  await tileset.tilesetInitializationPromise;
  tileset.setProps({maximumMemoryUsage: 2, maximumCacheOverflowBytes: 30});
  expect(tileset.cacheBytes, 'updates from the deprecated base option').toBe(
    2 * BYTES_PER_MEBIBYTE
  );
  expect(tileset.maximumCacheOverflowBytes, 'updates the byte-native overflow option').toBe(30);
  tileset.setProps({cacheBytes: 40, maximumMemoryUsage: 9, memoryCacheOverflow: 4});
  expect(tileset.cacheBytes, 'byte-native base option wins during runtime updates').toBe(40);
  expect(
    tileset.maximumCacheOverflowBytes,
    'an independently supplied legacy overflow option still converts correctly'
  ).toBe(4 * BYTES_PER_MEBIBYTE);
});
test('Tileset3D#cache byte budgets reject unstable thresholds', async () => {
  expect(() => createTestTileset({cacheBytes: -1}), 'rejects negative construction values').toThrow(
    /cacheBytes must be a finite number greater than or equal to 0/
  );
  expect(
    () => createTestTileset({maximumCacheOverflowBytes: Number.POSITIVE_INFINITY}),
    'rejects infinite construction values'
  ).toThrow(/maximumCacheOverflowBytes must be a finite number greater than or equal to 0/);
  const tileset = createTestTileset();
  await tileset.tilesetInitializationPromise;
  expect(() => {
    tileset.cacheBytes = Number.NaN;
  }).toThrow(/cacheBytes must be a finite number greater than or equal to 0/);
  expect(() => {
    tileset.maximumMemoryUsage = -1;
  }).toThrow(/maximumMemoryUsage must be a finite number greater than or equal to 0/);
});
test('Tileset3D#memory-adjusted SSE uses base plus overflow as its pressure ceiling', async () => {
  const tileset = createTestTileset({
    cacheBytes: 100,
    maximumCacheOverflowBytes: 20,
    maximumScreenSpaceError: 10
  });
  await tileset.tilesetInitializationPromise;
  tileset.gpuMemoryUsageInBytes = 120;
  tileset.adjustScreenSpaceError();
  expect(tileset.memoryAdjustedScreenSpaceError, 'does not adjust inside the overflow window').toBe(
    10
  );
  tileset.gpuMemoryUsageInBytes = 121;
  tileset.adjustScreenSpaceError();
  expect(tileset.memoryAdjustedScreenSpaceError, 'reduces LOD demand above the ceiling').toBe(10.2);
  tileset.gpuMemoryUsageInBytes = 99;
  tileset.adjustScreenSpaceError();
  expect(tileset.memoryAdjustedScreenSpaceError, 'restores the configured SSE below base').toBe(10);
});
test('TilesetCache#unloadTiles evicts by exact bytes and protects current-frame tiles', async () => {
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
  expect(unloadedTiles, 'evicts eligible tiles in LRU order').toEqual([firstTile, secondTile]);
  expect(tileset.gpuMemoryUsageInBytes, 'stops after reaching the exact byte target').toBe(100);
  expect(protectedTile._cacheNode, 'retains the tile touched in the current frame').toBeTruthy();
});
