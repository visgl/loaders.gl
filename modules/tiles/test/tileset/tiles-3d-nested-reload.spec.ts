// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D, traverseTilesetContents, type Tile3D} from '@loaders.gl/tiles';

/** Creates a normalized header with a small sphere and ordered content descriptors. */
function createHeader(id: string, contentUrls: string[] = []) {
  return {
    id,
    boundingVolume: {sphere: [6_378_137, 0, 0, 1]},
    refine: 'ADD',
    lodMetricType: 'geometricError',
    lodMetricValue: 1,
    contentUrls,
    content: contentUrls.map(uri => ({uri})),
    children: []
  };
}

/** Creates real source/runtime nodes with fresh resolver payloads on every read and no network. */
function createFixture() {
  const nestedTileset = {
    shape: 'tileset3d',
    asset: {version: '1.1'},
    root: {...createHeader('nested-root'), children: [createHeader('leaf', ['leaf.glb'])]}
  };
  const loadResource = vi.fn(async (url: string) =>
    url.endsWith('external.json')
      ? structuredClone(nestedTileset)
      : {type: 'b3dm', byteLength: 1, destroy: vi.fn()}
  );
  const source = new Tiles3DSource({
    shape: 'tileset3d',
    type: 'TILES3D',
    url: '/fixture/tileset.json',
    loader: Tiles3DLoader,
    asset: {version: '1.1'},
    lodMetricType: 'geometricError',
    lodMetricValue: 1,
    resolver: {
      async loadRoot() {
        throw new Error('Root metadata is preloaded');
      },
      loadResource
    },
    root: {
      ...createHeader('root'),
      children: [
        createHeader('first', ['external.json', 'mesh.glb', 'external.json']),
        createHeader('second', ['external.json'])
      ]
    }
  });
  return {tileset: new Tileset3D(source), source, loadResource};
}

/** Collects placement identities while allowing the traversal to unload each consumed payload. */
async function readPlacements(tileset: Tileset3D): Promise<Tile3D[]> {
  const placements: Tile3D[] = [];
  for await (const item of traverseTilesetContents(tileset, {unloadContent: true})) {
    placements.push(item.tile);
  }
  return placements;
}

test('cleanup and repeated traversal preserve nested placement identities, order and counts', async () => {
  const {tileset, loadResource} = createFixture();
  try {
    const first = await readPlacements(tileset);
    expect(first.map(tile => tile.id)).toEqual([
      'root',
      'first',
      'nested-root',
      'leaf',
      'nested-root',
      'leaf',
      'second',
      'nested-root',
      'leaf'
    ]);
    expect(first.filter(tile => tile.contentUrls.length).every(tile => tile.content === null)).toBe(
      true
    );
    expect(loadResource).toHaveBeenCalledTimes(7);
    const tileCount = tileset.stats.get('Tiles In Tileset(s)').count;
    expect(tileCount).toBe(9);
    const second = await readPlacements(tileset);
    expect(second.map(tile => first.indexOf(tile))).toEqual(first.map((_, index) => index));
    expect(loadResource).toHaveBeenCalledTimes(14);
    expect(tileset.stats.get('Tiles In Tileset(s)').count).toBe(tileCount);
    expect(first[1].children).toHaveLength(2);
    expect(first[6].children).toHaveLength(1);
    expect(first[2]).not.toBe(first[4]);
    expect(first[2]).not.toBe(first[7]);
  } finally {
    tileset.destroy();
  }
});

test('early iterator closure preserves installed nested roots for the next traversal', async () => {
  const {tileset} = createFixture();
  const reader = traverseTilesetContents(tileset, {unloadContent: true});
  try {
    await reader.next();
    const parent = (await reader.next()).value!.tile;
    const installedRoots = [...parent.children];
    await reader.return(undefined);
    expect(parent.content).toBeNull();
    expect(await readPlacements(tileset)).toHaveLength(9);
    expect(parent.children[0]).toBe(installedRoots[0]);
    expect(parent.children[1]).toBe(installedRoots[1]);
    expect(tileset.stats.get('Tiles In Tileset(s)').count).toBe(9);
  } finally {
    await reader.return(undefined);
    tileset.destroy();
  }
});

test('normal content reload reuses attached roots and reinstalls only a detached slot', async () => {
  const {tileset, source} = createFixture();
  try {
    await tileset.tilesetInitializationPromise;
    const parent = tileset.root!.children[0];
    source.onTileLoaded(tileset, parent, await parent.loadContent());
    const firstRoot = parent.children[0];
    const detachedRoot = parent.children.pop()!;
    parent.unloadContent();
    source.onTileLoaded(tileset, parent, await parent.loadContent());
    expect(parent.children).toHaveLength(2);
    expect(parent.children[0]).toBe(firstRoot);
    expect(parent.children[1]).not.toBe(detachedRoot);
    expect(parent.children[1].id).toBe(detachedRoot.id);
    detachedRoot.destroy();
  } finally {
    tileset.destroy();
  }
});

test('retry after partial nested installation does not append successful slots again', async () => {
  const {tileset} = createFixture();
  try {
    await tileset.tilesetInitializationPromise;
    const initializeTileHeaders = tileset._initializeTileHeaders.bind(tileset);
    vi.spyOn(tileset, '_initializeTileHeaders')
      .mockImplementationOnce(initializeTileHeaders)
      .mockImplementationOnce(() => {
        throw new Error('second nested install failed');
      })
      .mockImplementation(initializeTileHeaders);
    await expect(readPlacements(tileset)).rejects.toThrow('second nested install failed');
    const parent = tileset.root!.children[0];
    expect(parent.content).toBeNull();
    const firstRoot = parent.children[0];
    expect(parent.children).toHaveLength(1);
    expect(await readPlacements(tileset)).toHaveLength(9);
    expect(parent.children[0]).toBe(firstRoot);
    expect(tileset.stats.get('Tiles In Tileset(s)').count).toBe(9);
  } finally {
    tileset.destroy();
  }
});
