// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {coreApi} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {
  IndexedArchiveTilesetSource,
  I3SSource,
  createImplicitSubtreeReference,
  LOD_METRIC_TYPE,
  Tile3D,
  Tiles3DSource,
  Tileset3D,
  TILE_REFINEMENT,
  isTileset3DSource,
  type ImplicitTilingDescriptor,
  type TilesetJSON,
  type TilesetSourceResolver
} from '@loaders.gl/tiles';
test('Tiles3DSource lazily loads, installs and caches one implicit subtree', async () => {
  const descriptor: ImplicitTilingDescriptor = {
    contentUrlTemplate: 'https://example.com/content/{level}/{x}/{y}.b3dm',
    subtreesUrlTemplate: 'https://example.com/subtrees/{level}/{x}/{y}.subtree',
    subdivisionScheme: 'QUADTREE',
    subtreeLevels: 1,
    maximumLevel: 1,
    refine: TILE_REFINEMENT.REPLACE,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue: 16,
    rootBoundingVolume: {region: [0, 0, 1, 1, 0, 10]}
  };
  const implicitSubtree = createImplicitSubtreeReference(descriptor, {
    level: 0,
    x: 0,
    y: 0,
    z: 0
  });
  /** Creates an independent runtime placeholder for the same subtree resource. */
  const createRootHeader = () => ({
    id: `${implicitSubtree.subtreeUrl}#implicit=0/0/0/0`,
    children: [],
    implicitSubtree,
    boundingVolume: descriptor.rootBoundingVolume,
    geometricError: 16,
    lodMetricType: descriptor.lodMetricType,
    lodMetricValue: 16,
    refine: descriptor.refine,
    type: 'empty'
  });
  const requestedUrls: string[] = [];
  let subtreeMode: unknown;
  const resolver: TilesetSourceResolver = {
    async loadRoot() {
      throw new Error('preloaded metadata should not request a root resource');
    },
    async loadResource(url, _loader, loadOptions) {
      requestedUrls.push(url);
      subtreeMode = (loadOptions['3d-tiles'] as Record<string, unknown>)?.isSubtree;
      return {
        tileAvailability: {constant: 1},
        contentAvailability: {constant: 1},
        childSubtreeAvailability: {constant: 1}
      };
    }
  };
  const tilesetJson: TilesetJSON = {
    shape: 'tileset3d',
    type: 'TILES3D',
    url: 'https://example.com/tileset.json',
    basePath: 'https://example.com',
    loader: Tiles3DLoader,
    resolver,
    asset: {version: '1.1'},
    queryString: 'token=abc',
    lodMetricType: descriptor.lodMetricType,
    lodMetricValue: 16,
    root: createRootHeader()
  };
  const source = new Tiles3DSource(tilesetJson, {
    '3d-tiles': {maximumCachedSubtrees: 2}
  });
  const tileset = new Tileset3D(source);
  await tileset.tilesetInitializationPromise;
  expect(requestedUrls.length, 'initialization performs no implicit subtree request').toBe(0);
  const root = tileset.root!;
  await root.loadChildren({} as any);
  expect(subtreeMode, 'routes bytes through subtree parsing mode').toBe(true);
  expect(requestedUrls).toEqual(['https://example.com/subtrees/0/0/0.subtree?token=abc']);
  expect(root.contentUrl).toBe('https://example.com/content/0/0/0.b3dm');
  expect(root.children.length, 'installs only the requested subtree boundary').toBe(4);
  expect(root.children.every(child => child.hasUnloadedChildren)).toBeTruthy();
  expect(root.childrenState).toBe('ready');
  const duplicateRoot = new Tile3D(tileset, createRootHeader());
  await duplicateRoot.loadChildren({} as any);
  expect(requestedUrls.length, 'deduplicates the final subtree URL through parsed cache').toBe(1);
  expect(source.getImplicitTilingStats()).toEqual({
    requestedSubtrees: 1,
    loadedSubtrees: 2,
    cacheHits: 1,
    cachedSubtrees: 1,
    pendingSubtrees: 0,
    materializedTiles: 8
  });
  tileset.destroy();
  expect(source.getImplicitTilingStats().cachedSubtrees, 'destroy releases parsed metadata').toBe(
    0
  );
});
test('isTileset3DSource recognizes explicit source implementations', () => {
  const tiles3DSource = new Tiles3DSource({
    url: 'https://example.com/tileset.json',
    loader: Tiles3DLoader,
    root: {refine: 'ADD'},
    asset: {version: '1.0'}
  } as any);
  const i3sSource = new I3SSource({
    url: 'https://example.com/layers/0',
    loader: I3SLoader,
    root: {refine: 'ADD'}
  } as any);
  expect(isTileset3DSource(tiles3DSource)).toBeTruthy();
  expect(isTileset3DSource(i3sSource)).toBeTruthy();
  expect(
    isTileset3DSource({
      initialize: async () => {},
      getRootTileset: async () => ({}),
      loadTileContent: async () => ({loaded: true})
    }),
    'partial lookalikes without initializeTileHeaders are rejected'
  ).toBeFalsy();
});
test('Tiles3DSource initializes metadata and merges source query parameters', async () => {
  const tilesetJson: TilesetJSON = {
    type: 'tileset',
    url: 'https://example.com/root/tileset.json',
    loader: Tiles3DLoader,
    asset: {version: '1.0', tilesetVersion: '42'},
    root: {refine: 'ADD'},
    lodMetricType: 'geometricError',
    lodMetricValue: 16,
    queryString: 'session=abc123',
    extensionsUsed: ['KHR_texture_basisu']
  };
  const source = new Tiles3DSource({...tilesetJson, coreApi});
  await source.initialize();
  const metadata = source.getMetadata();
  expect(metadata.basePath).toBe('https://example.com/root');
  expect(metadata.refine).toBe('ADD');
  expect(source.hasExtension('KHR_texture_basisu')).toBeTruthy();
  expect(source.getTileUrl('https://example.com/root/tile.b3dm?existing=1')).toBe(
    'https://example.com/root/tile.b3dm?existing=1&session=abc123&v=42'
  );
  expect(source.getTileUrl('data:application/octet-stream;base64,AA==')).toBe(
    'data:application/octet-stream;base64,AA=='
  );
});
test('I3SSource initializes promised roots and appends auth tokens to tile urls', async () => {
  const source = new I3SSource(
    {
      type: 'tileset',
      url: 'https://example.com/SceneServer/layers/0',
      loader: I3SLoader,
      root: Promise.resolve({id: 'root-node', refine: 'ADD'}),
      lodMetricType: 'maxScreenThresholdSQ',
      lodMetricValue: 4,
      nodePagesTile: {nodesInNodePages: 7},
      store: {extent: [0, 0, 1, 1]}
    } as any,
    {i3s: {token: 'secret-token'}}
  );
  await source.initialize();
  const metadata = source.getMetadata();
  expect(metadata.tileset.root.id, 'promised roots are awaited during initialization').toBe(
    'root-node'
  );
  expect(source.getTileUrl('https://example.com/SceneServer/layers/0/nodes/1')).toBe(
    'https://example.com/SceneServer/layers/0/nodes/1?token=secret-token'
  );
  expect(source.getTilesTotalCount()).toBe(7);
});
test('Tiles3DSource uses injected resolvers for root metadata and tile content', async () => {
  const rootTileset: TilesetJSON = {
    asset: {version: '1.0'},
    root: {
      refine: 'ADD',
      children: [],
      content: {uri: 'root.b3dm'}
    },
    lodMetricType: 'geometricError',
    lodMetricValue: 16
  };
  const tileContent = {content: 'from-resolver'};
  let rootLoadCount = 0;
  let resourceLoadCount = 0;
  let resourceTilesetMode: unknown;
  const resolver: TilesetSourceResolver = {
    async loadRoot() {
      rootLoadCount++;
      return rootTileset;
    },
    async loadResource(_url, _loader, loadOptions) {
      resourceLoadCount++;
      resourceTilesetMode = (loadOptions['3d-tiles'] as Record<string, unknown>)?.isTileset;
      return tileContent;
    }
  };
  const source = new Tiles3DSource(
    {
      url: 'https://example.com/root/test.3tz',
      loader: Tiles3DLoader,
      basePath: 'https://example.com/root/test.3tz',
      resolver
    },
    {}
  );
  await source.initialize();
  const tile = {contentUrl: 'https://example.com/root/test.3tz/root.b3dm', type: 'b3dm'} as any;
  const loadResult = await source.loadTileContent(tile);
  expect(rootLoadCount, 'root metadata goes through the injected resolver').toBe(1);
  expect(resourceLoadCount, 'tile content goes through the injected resolver').toBe(1);
  expect(resourceTilesetMode, 'content kind is detected from bytes rather than URL').toBe('auto');
  expect(tile.content).toBe(tileContent);
  expect(loadResult.nestedTileset).toBeFalsy();
});
test('Tiles3DSource recognizes extensionless nested tilesets from parsed shape', async () => {
  const nestedTileset = {shape: 'tileset3d', asset: {version: '1.1'}, root: {}};
  const resolver: TilesetSourceResolver = {
    async loadRoot() {
      return {
        asset: {version: '1.1'},
        root: {refine: 'REPLACE'},
        lodMetricType: 'geometricError',
        lodMetricValue: 1
      };
    },
    async loadResource() {
      return nestedTileset;
    }
  };
  const source = new Tiles3DSource({
    url: 'https://example.com/root',
    loader: Tiles3DLoader,
    resolver
  });
  await source.initialize();
  const tile = {contentUrl: 'https://example.com/nested/signed-resource?token=one'} as any;
  const loadResult = await source.loadTileContent(tile);
  expect(loadResult.nestedTileset).toBe(nestedTileset);
  expect(tile.content).toBe(nestedTileset);
});
test('Tiles3DSource invalidates cached URLs when inherited query state changes', async () => {
  const source = new Tiles3DSource({
    type: 'tileset',
    url: 'https://example.com/tileset.json',
    loader: Tiles3DLoader,
    asset: {version: '1.1'},
    root: {refine: 'REPLACE'},
    lodMetricType: 'geometricError',
    lodMetricValue: 1,
    queryString: 'token=one'
  } as any);
  await source.initialize();
  const tilePath = 'https://example.com/tile.b3dm';
  expect(source.getTileUrl(tilePath)).toBe(`${tilePath}?token=one`);
  (source as any).setQueryParameter('token', 'two');
  expect(source.getTileUrl(tilePath), 'does not return a stale cached URL').toBe(
    `${tilePath}?token=two`
  );
});
test('I3SSource uses injected resolvers for root metadata and child headers', async () => {
  let rootLoadCount = 0;
  const requestedUrls: string[] = [];
  const resolver: TilesetSourceResolver = {
    async loadRoot() {
      rootLoadCount++;
      return {
        root: {id: 'root-node', refine: 'ADD'},
        lodMetricType: 'maxScreenThresholdSQ',
        lodMetricValue: 4
      };
    },
    async loadResource(url) {
      requestedUrls.push(url);
      return {id: '7', refine: 'ADD'};
    }
  };
  const source = new I3SSource(
    {
      url: 'https://example.com/archive/test.slpk',
      loader: I3SLoader,
      basePath: 'https://example.com/archive/test.slpk',
      resolver
    },
    {}
  );
  await source.initialize();
  const childHeader = await source.loadChildTileHeader?.({} as any, '7', {} as any);
  expect(rootLoadCount, 'root metadata goes through the injected resolver').toBe(1);
  expect(requestedUrls).toEqual(['https://example.com/archive/test.slpk/nodes/7']);
  expect(childHeader?.id).toBe('7');
});
test('IndexedArchiveTilesetSource loads root metadata and nested resources from an archive', async () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const files: Record<string, string> = {
    'tileset.json': 'root',
    'models/tile.b3dm': 'tile'
  };
  const fileRequests: {
    path: string;
    mode?: string;
  }[] = [];
  let parseArchiveCount = 0;
  const coreApiMock = {
    async fetchFile() {
      throw new Error('Blob archive inputs should not use coreApi.fetchFile');
    },
    async parse(data: ArrayBuffer, _loader: any, _options: any, context: any) {
      const text = decoder.decode(data);
      if (context.url === 'memory://tileset.3tz') {
        const response = await context.fetch('models/tile.b3dm?token=1');
        return {text, nestedText: await response.text()};
      }
      return {text};
    }
  } as any;
  const archiveSource = new IndexedArchiveTilesetSource({
    data: new Blob([encoder.encode('archive')]),
    fallbackFilename: 'tileset.3tz',
    archiveExtension: '3tz',
    rootPath: 'tileset.json',
    parseArchive: async () => {
      parseArchiveCount++;
      return files;
    },
    getFile: async (archive, pathInArchive, mode) => {
      fileRequests.push({path: pathInArchive, mode});
      return encoder.encode(archive[pathInArchive]).buffer;
    },
    getCoreApi: () => coreApiMock,
    missingCoreApiMessage: 'missing core api'
  });
  const root = await archiveSource.loadRoot('memory://tileset.3tz', {} as any, {});
  expect(archiveSource.sourceUrl).toBe('memory://tileset.3tz');
  expect(root).toEqual({text: 'root', nestedText: 'tile'});
  expect(parseArchiveCount, 'archive is opened and parsed once').toBe(1);
  expect(fileRequests).toEqual([
    {path: 'tileset.json', mode: undefined},
    {path: 'models/tile.b3dm', mode: undefined}
  ]);
});
test('IndexedArchiveTilesetSource resolves archive marker paths and local inputs', async () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const archiveInput = encoder.encode('archive').buffer;
  const fileRequests: {
    path: string;
    mode?: string;
  }[] = [];
  let fetchFileCount = 0;
  const coreApiMock = {
    async fetchFile(url: string | Blob) {
      fetchFileCount++;
      expect(url).toBe('local/archive.slpk');
      return new Response(archiveInput);
    },
    async parse(data: ArrayBuffer, _loader: any, _options: any, context: any) {
      return {
        url: context.url,
        text: decoder.decode(data)
      };
    }
  } as any;
  const archiveSource = new IndexedArchiveTilesetSource({
    data: 'local/archive.slpk',
    fallbackFilename: 'tileset.slpk',
    archiveExtension: 'slpk',
    rootPath: '',
    rootMode: 'http',
    parseArchive: async () => ({'': 'layer', 'nodes/7': 'node'}),
    getFile: async (archive, pathInArchive, mode) => {
      fileRequests.push({path: pathInArchive, mode});
      return encoder.encode(archive[pathInArchive]).buffer;
    },
    getCoreApi: () => coreApiMock,
    missingCoreApiMessage: 'missing core api'
  });
  const root = await archiveSource.loadRoot('local/archive.slpk', {} as any, {});
  const resource = await archiveSource.loadResource(
    'local/archive.slpk/nodes/7?token=1',
    {} as any,
    {}
  );
  expect(root).toEqual({url: 'local/archive.slpk', text: 'layer'});
  expect(resource).toEqual({url: 'local/archive.slpk/nodes/7?token=1', text: 'node'});
  expect(fetchFileCount, 'local archive input is loaded once through coreApi.fetchFile').toBe(1);
  expect(fileRequests).toEqual([
    {path: '', mode: 'http'},
    {path: 'nodes/7', mode: undefined}
  ]);
});
test('IndexedArchiveTilesetSource throws a configured error without core API', async () => {
  const archiveSource = new IndexedArchiveTilesetSource({
    data: 'local/archive.3tz',
    fallbackFilename: 'tileset.3tz',
    archiveExtension: '3tz',
    rootPath: 'tileset.json',
    parseArchive: async () => ({}),
    getFile: async () => new ArrayBuffer(0),
    getCoreApi: () => undefined,
    missingCoreApiMessage: 'archive source needs core api'
  });
  try {
    await archiveSource.loadRoot('local/archive.3tz', {} as any, {});
    (() => {
      throw new Error('loadRoot should fail without core API');
    })();
  } catch (error) {
    expect((error as Error).message).toBe('archive source needs core api');
  }
});
