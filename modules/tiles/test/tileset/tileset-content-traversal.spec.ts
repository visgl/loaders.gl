import {describe, expect, test} from 'vitest';
import {TILESET_TYPE} from '../../src/constants';
import type {Tile3D} from '../../src/tileset-3d/common/tile-3d';
import type {Tileset3D} from '../../src/tileset-3d/common/tileset-3d';
import {traverseTilesetContents} from '../../src/tileset-3d/common/tileset-content-traversal';

type TestTile = Tile3D & {
  id: string;
  header: Record<string, any>;
  contentUrls: string[];
  content: unknown;
  contentEntries: Array<Record<string, unknown>>;
  childrenState: 'ready' | 'unloaded';
  children: TestTile[];
  loadContent(): Promise<{loaded: boolean; contents: unknown[]; nestedTilesets?: unknown[]}>;
};

function createTestTile(
  id: string,
  contentUrls: string[] = [],
  header: Record<string, any> = {}
): TestTile {
  const tile = {
    id,
    header,
    contentUrls,
    content: null,
    contentEntries: [],
    childrenState: header.implicitSubtree ? 'unloaded' : 'ready',
    children: [],
    async loadContent() {
      const contents = this.contentUrls.map(uri => ({uri}));
      this.content = contents[0] || null;
      this.contentEntries = contents.map((payload, index) => ({
        index,
        uri: payload.uri,
        payload,
        metadata: null,
        boundingVolume: null,
        featureIds: [],
        renderable: true
      }));
      return {loaded: true, contents};
    }
  };
  return tile as TestTile;
}

function createTestTileset(root: TestTile, type = TILESET_TYPE.TILES3D) {
  const loadedUrls: string[] = [];
  const tileset = {
    type,
    root,
    tilesetInitializationPromise: Promise.resolve(),
    source: {
      async loadTileChildrenForTraversal(tile: TestTile) {
        if (tile.header.implicitSubtree) {
          tile.children.push(createTestTile('implicit-child', ['implicit.glb']));
        } else {
          for (const childHeader of tile.header.children || []) {
            tile.children.push(createTestTile(String(childHeader.id), [`${childHeader.id}.glb`]));
          }
        }
        return {loaded: true, tileCount: tile.children.length, childSubtreeCount: 0};
      },
      async onTileLoaded(_tileset: unknown, tile: TestTile, result: {contents: unknown[]}) {
        loadedUrls.push(...tile.contentUrls);
        for (const content of result.contents as Array<{uri: string}>) {
          if (content.uri === 'external.json') {
            tile.children.push(createTestTile('external-root', ['external-child.glb']));
          }
        }
      }
    }
  } as unknown as Tileset3D;
  return {tileset, loadedUrls};
}

describe('traverseTilesetContents', () => {
  test('visits multi-content, implicit, and external placements in deterministic order', async () => {
    const root = createTestTile('root', ['root-mesh.glb', 'external.json'], {
      content: [{uri: 'root-mesh.glb'}, {uri: 'external.json'}]
    });
    root.children.push(
      createTestTile('implicit', ['shared.glb'], {implicitSubtree: {uri: 'subtree'}}),
      createTestTile('shared-placement', ['shared.glb'])
    );
    const {tileset, loadedUrls} = createTestTileset(root);

    const items = [];
    for await (const item of traverseTilesetContents(tileset)) {
      items.push(item);
    }

    expect(items.map(item => item.tile.id)).toEqual([
      'root',
      'implicit',
      'implicit-child',
      'shared-placement',
      'external-root'
    ]);
    expect(items[0].contents.map(content => content.uri)).toEqual([
      'root-mesh.glb',
      'external.json'
    ]);
    expect(loadedUrls.filter(uri => uri === 'shared.glb')).toHaveLength(2);
  });

  test('loads I3S child headers without a viewport', async () => {
    const root = createTestTile('i3s-root', [], {children: [{id: 'node-1'}, {id: 'node-2'}]});
    const {tileset} = createTestTileset(root, TILESET_TYPE.I3S);

    const items = [];
    for await (const item of traverseTilesetContents(tileset)) {
      items.push(item);
    }

    expect(items.map(item => item.tile.id)).toEqual(['i3s-root', 'node-1', 'node-2']);
  });

  test('stops before visiting the next tile when cancelled', async () => {
    const root = createTestTile('root');
    root.children.push(createTestTile('child'));
    const {tileset} = createTestTileset(root);
    const controller = new AbortController();
    const items = [];

    await expect(async () => {
      for await (const item of traverseTilesetContents(tileset, {signal: controller.signal})) {
        items.push(item);
        controller.abort(new Error('cancelled'));
      }
    }).rejects.toThrow('cancelled');

    expect(items.map(item => item.tile.id)).toEqual(['root']);
  });
});
