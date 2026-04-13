// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {
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
  const source = new Tiles3DSource(tilesetJson);

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

  const resolver: TilesetSourceResolver = {
    async loadRoot() {
      rootLoadCount++;
      return rootTileset;
    },
    async loadResource() {
      resourceLoadCount++;
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
  t.equal(tile.content, tileContent);
  t.notOk(loadResult.nestedTileset);
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
