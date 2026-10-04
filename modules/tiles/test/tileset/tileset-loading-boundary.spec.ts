// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tileset3D} from '../../src/tileset-3d/common/tileset-3d';
import {Tile3D} from '../../src/tileset-3d/common/tile-3d';
import {Tiles3DSource} from '../../src/tileset-3d/format-3d-tiles/tiles-3d-source';

/** Initializes a contentless runtime with callbacks that record normalized failures. */
async function createTileset() {
  const onSourceError = vi.fn();
  const onTileError = vi.fn();
  const onTileLoad = vi.fn();
  const source = new Tiles3DSource({
    type: 'TILES3D',
    url: '/tiles/tileset.json',
    loader: Tiles3DLoader,
    asset: {version: '1.1'},
    root: {
      id: 'root',
      refine: 'REPLACE',
      lodMetricType: 'geometricError',
      lodMetricValue: 0,
      boundingVolume: {sphere: [6378137, 0, 0, 1]}
    }
  } as any);
  const tileset = new Tileset3D(source, {onSourceError, onTileError, onTileLoad});
  await tileset.tilesetInitializationPromise;
  return {tileset, source, onSourceError, onTileError, onTileLoad};
}

afterEach(() => vi.restoreAllMocks());

describe('Tileset3D loading lifecycle boundaries', () => {
  test.each([
    {failure: new Error('content failed'), message: 'content failed'},
    {failure: 'transport failure', message: 'load failed'}
  ])('balances loading counters and reports content failure: $message', async ({
    failure,
    message
  }) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const {tileset, source, onSourceError, onTileError, onTileLoad} = await createTileset();
    const tile = tileset.root!;
    vi.spyOn(Tile3D.prototype, 'loadContent').mockRejectedValueOnce(failure);
    await tileset._loadTile(tile);
    expect(onSourceError).toHaveBeenCalledOnce();
    const normalizedError = onSourceError.mock.calls[0][0] as Error;
    expect(normalizedError).toBeInstanceOf(Error);
    expect(normalizedError.message).toBe(message);
    if (failure instanceof Error) expect(normalizedError).toBe(failure);
    expect(onSourceError).toHaveBeenCalledWith(normalizedError, source, tile);
    expect(onTileError).toHaveBeenCalledWith(tile, message, tile.url);
    expect(onTileLoad).not.toHaveBeenCalled();
    expect(tileset.stats.get('Tiles Loading').count).toBe(0);
    expect(tileset.stats.get('Failed Tile Loads').count).toBe(1);
    tileset.destroy();
  });

  test.each([
    {failure: new Error('metadata failed'), message: 'metadata failed'},
    {failure: null, message: 'subtree load failed'}
  ])('balances loading counters and reports child-header failure: $message', async ({
    failure,
    message
  }) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const {tileset, source, onSourceError, onTileError, onTileLoad} = await createTileset();
    const tile = tileset.root!;
    const frameState = {frameNumber: 1, viewport: {id: 'main'}} as any;
    const loadChildren = vi.spyOn(Tile3D.prototype, 'loadChildren').mockRejectedValueOnce(failure);
    await tileset._loadTileChildren(tile, frameState);
    expect(loadChildren).toHaveBeenCalledWith(frameState);
    expect(onSourceError).toHaveBeenCalledWith(expect.any(Error), source, tile);
    expect(onTileError).toHaveBeenCalledWith(tile, message, tile.url);
    expect(onTileLoad).not.toHaveBeenCalled();
    expect(tileset.stats.get('Tiles Loading').count).toBe(0);
    expect(tileset.stats.get('Failed Tile Loads').count).toBe(1);
    expect(tileset.gpuMemoryUsageInBytes).toBe(0);
    tileset.destroy();
  });

  test('tracks a pending lazy child request without treating headers as render content', async () => {
    const {tileset, onTileLoad} = await createTileset();
    let resolveChildren!: (result: any) => void;
    vi.spyOn(Tile3D.prototype, 'loadChildren').mockImplementation(
      () =>
        new Promise(resolve => {
          resolveChildren = resolve;
        })
    );
    const loading = tileset._loadTileChildren(tileset.root!, {} as any);
    expect(tileset.stats.get('Tiles Loading').count).toBe(1);
    resolveChildren({loaded: true, tileCount: 2, childSubtreeCount: 1});
    await loading;
    expect(tileset.stats.get('Tiles Loading').count).toBe(0);
    expect(tileset.stats.get('Tiles Loaded').count).toBe(0);
    expect(tileset.stats.get('Failed Tile Loads').count).toBe(0);
    expect(onTileLoad).not.toHaveBeenCalled();
    expect(tileset.gpuMemoryUsageInBytes).toBe(0);
    tileset.destroy();
  });

  test('keeps cancelled content loads out of the cache and balances counters', async () => {
    const {tileset, onTileLoad} = await createTileset();
    vi.spyOn(Tile3D.prototype, 'loadContent').mockResolvedValueOnce({loaded: false});
    await tileset._loadTile(tileset.root!);
    expect(tileset.stats.get('Tiles Loading').count).toBe(0);
    expect(tileset.stats.get('Tiles Loaded').count).toBe(0);
    expect(onTileLoad).not.toHaveBeenCalled();
    expect(tileset.tiles).toEqual([]);
    expect(tileset.getTileUrl('/plain')).toBe('/plain');
    expect(tileset.queryParams).toBe('');
    tileset.destroy();
  });
});
