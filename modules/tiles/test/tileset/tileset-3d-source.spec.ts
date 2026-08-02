// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {coreApi} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {
  IndexedArchiveTilesetSource,
  I3SSource,
  Tiles3DSource,
  isTileset3DSource,
  type TilesetJSON,
  type TilesetSourceResolver
} from '@loaders.gl/tiles';

test('isTileset3DSource recognizes explicit source implementations', t => {
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

  t.ok(isTileset3DSource(tiles3DSource));
  t.ok(isTileset3DSource(i3sSource));
  t.notOk(
    isTileset3DSource({
      initialize: async () => {},
      getRootTileset: async () => ({}),
      loadTileContent: async () => ({loaded: true})
    }),
    'partial lookalikes without initializeTileHeaders are rejected'
  );
  t.end();
});

test('Tiles3DSource initializes metadata and merges source query parameters', async t => {
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
  t.equal(metadata.basePath, 'https://example.com/root');
  t.equal(metadata.refine, 'ADD');
  t.ok(source.hasExtension('KHR_texture_basisu'));
  t.equal(
    source.getTileUrl('https://example.com/root/tile.b3dm?existing=1'),
    'https://example.com/root/tile.b3dm?existing=1&session=abc123&v=42'
  );
  t.equal(
    source.getTileUrl('data:application/octet-stream;base64,AA=='),
    'data:application/octet-stream;base64,AA=='
  );
  t.end();
});

test('I3SSource initializes promised roots and appends auth tokens to tile urls', async t => {
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
  t.equal(
    metadata.tileset.root.id,
    'root-node',
    'promised roots are awaited during initialization'
  );
  t.equal(
    source.getTileUrl('https://example.com/SceneServer/layers/0/nodes/1'),
    'https://example.com/SceneServer/layers/0/nodes/1?token=secret-token'
  );
  t.equal(source.getTilesTotalCount(), 7);
  t.end();
});

test('Tiles3DSource uses injected resolvers for root metadata and tile content', async t => {
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

  t.equal(rootLoadCount, 1, 'root metadata goes through the injected resolver');
  t.equal(resourceLoadCount, 1, 'tile content goes through the injected resolver');
  t.equal(resourceTilesetMode, 'auto', 'content kind is detected from bytes rather than URL');
  t.equal(tile.content, tileContent);
  t.notOk(loadResult.nestedTileset);
  t.end();
});

test('Tiles3DSource recognizes extensionless nested tilesets from parsed shape', async t => {
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
  t.equal(loadResult.nestedTileset, nestedTileset);
  t.equal(tile.content, nestedTileset);
  t.end();
});

test('Tiles3DSource invalidates cached URLs when inherited query state changes', async t => {
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
  t.equal(source.getTileUrl(tilePath), `${tilePath}?token=one`);
  (source as any).setQueryParameter('token', 'two');
  t.equal(
    source.getTileUrl(tilePath),
    `${tilePath}?token=two`,
    'does not return a stale cached URL'
  );
  t.end();
});

test('I3SSource uses injected resolvers for root metadata and child headers', async t => {
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

  t.equal(rootLoadCount, 1, 'root metadata goes through the injected resolver');
  t.deepEqual(requestedUrls, ['https://example.com/archive/test.slpk/nodes/7']);
  t.equal(childHeader?.id, '7');
  t.end();
});

test('IndexedArchiveTilesetSource loads root metadata and nested resources from an archive', async t => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const files: Record<string, string> = {
    'tileset.json': 'root',
    'models/tile.b3dm': 'tile'
  };
  const fileRequests: {path: string; mode?: string}[] = [];
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

  t.equal(archiveSource.sourceUrl, 'memory://tileset.3tz');
  t.deepEqual(root, {text: 'root', nestedText: 'tile'});
  t.equal(parseArchiveCount, 1, 'archive is opened and parsed once');
  t.deepEqual(fileRequests, [
    {path: 'tileset.json', mode: undefined},
    {path: 'models/tile.b3dm', mode: undefined}
  ]);
  t.end();
});

test('IndexedArchiveTilesetSource resolves archive marker paths and local inputs', async t => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const archiveInput = encoder.encode('archive').buffer;
  const fileRequests: {path: string; mode?: string}[] = [];
  let fetchFileCount = 0;

  const coreApiMock = {
    async fetchFile(url: string | Blob) {
      fetchFileCount++;
      t.equal(url, 'local/archive.slpk');
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

  t.deepEqual(root, {url: 'local/archive.slpk', text: 'layer'});
  t.deepEqual(resource, {url: 'local/archive.slpk/nodes/7?token=1', text: 'node'});
  t.equal(fetchFileCount, 1, 'local archive input is loaded once through coreApi.fetchFile');
  t.deepEqual(fileRequests, [
    {path: '', mode: 'http'},
    {path: 'nodes/7', mode: undefined}
  ]);
  t.end();
});

test('IndexedArchiveTilesetSource throws a configured error without core API', async t => {
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
    t.fail('loadRoot should fail without core API');
  } catch (error) {
    t.equal((error as Error).message, 'archive source needs core api');
  }
  t.end();
});
