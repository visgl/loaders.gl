// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Tiles3DArchiveFileLoader, Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {I3SLoader, SLPKLoader} from '@loaders.gl/i3s';
import {I3SSource, Tile3D, Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {createSource} from '@loaders.gl/deck-layers';
import {loadArrayBufferFromFile} from 'test/utils/readable-files';
import {
  createSLPKArchiveResolver,
  createTiles3DArchiveResolver
} from '../src/archive-source-resolver';

const TILES_ARCHIVE_URL = '@loaders.gl/3d-tiles/test/data/test.3tz';
const SLPK_ARCHIVE_URL = '@loaders.gl/i3s/test/data/DA12_subset.slpk';

test('createSource#selects Tiles3DSource for 3tz urls', t => {
  const source = createSource('https://example.com/data/test.3tz', Tiles3DLoader, {});
  t.ok(source instanceof Tiles3DSource);
  t.end();
});

test('createSource#selects I3SSource for slpk urls', t => {
  const source = createSource('https://example.com/data/test.slpk', I3SLoader, {});
  t.ok(source instanceof I3SSource);
  t.end();
});

test('createSource#normalizes archive loaders to standard source classes', t => {
  const tiles3DSource = createSource(
    'https://example.com/data/test.3tz',
    Tiles3DArchiveFileLoader,
    {}
  );
  const i3sSource = createSource('https://example.com/data/test.slpk', SLPKLoader, {});

  t.ok(tiles3DSource instanceof Tiles3DSource);
  t.ok(i3sSource instanceof I3SSource);
  t.end();
});

test('createSource#keeps non-archive loaders on standard source classes', t => {
  const tiles3DSource = createSource('https://example.com/data/tileset.json', Tiles3DLoader, {});
  const i3sSource = createSource('https://example.com/data/layers/0', I3SLoader, {});

  t.ok(tiles3DSource instanceof Tiles3DSource);
  t.ok(i3sSource instanceof I3SSource);
  t.end();
});

test('createSource#initializes Tileset3D from a 3tz url', async t => {
  const source = createSource(TILES_ARCHIVE_URL, Tiles3DLoader, {});
  const tileset = new Tileset3D(source);
  await tileset.tilesetInitializationPromise;

  t.ok(tileset.root, 'root tile created from archive metadata');
  t.equal(tileset.asset.version, '1.0', 'archive metadata parsed through Tiles3DSource');
  await tileset._loadTile(tileset.root as Tile3D);
  t.ok(tileset.root?.content, 'tile content loaded through the reused archive accessor');
  t.end();
});

test('createSource#initializes Tileset3D from an slpk url', async t => {
  const source = createSource(SLPK_ARCHIVE_URL, I3SLoader, {});
  const tileset = new Tileset3D(source);
  await tileset.tilesetInitializationPromise;

  t.ok(tileset.root, 'root tile created from SLPK metadata');
  const childHeader = await source.loadChildTileHeader?.(tileset.root as Tile3D, '3', {} as any);
  t.equal(childHeader?.id, '3', 'child headers load through the reused SLPK accessor');
  t.end();
});

test('archive resolvers support blob-backed 3tz and slpk inputs', async t => {
  const tilesArchiveBuffer = await loadArrayBufferFromFile(TILES_ARCHIVE_URL);
  const slpkArchiveBuffer = await loadArrayBufferFromFile(SLPK_ARCHIVE_URL);
  const tilesArchiveConfig = createTiles3DArchiveResolver(
    new Blob([tilesArchiveBuffer]),
    Tiles3DLoader
  );
  const slpkArchiveConfig = createSLPKArchiveResolver(new Blob([slpkArchiveBuffer]), I3SLoader);

  const tiles3DSource = new Tiles3DSource(
    {
      url: 'memory://test.3tz',
      loader: tilesArchiveConfig.loader,
      basePath: 'memory://test.3tz',
      resolver: tilesArchiveConfig.resolver
    },
    {}
  );
  const i3sSource = new I3SSource(
    {
      url: 'memory://test.slpk',
      loader: slpkArchiveConfig.loader,
      basePath: 'memory://test.slpk',
      resolver: slpkArchiveConfig.resolver
    },
    {}
  );

  const tiles3DTileset = new Tileset3D(tiles3DSource);
  const i3sTileset = new Tileset3D(i3sSource);
  await Promise.all([
    tiles3DTileset.tilesetInitializationPromise,
    i3sTileset.tilesetInitializationPromise
  ]);

  t.equal(tiles3DTileset.asset.version, '1.0', 'blob-backed 3tz source initializes');
  t.ok(i3sTileset.root, 'blob-backed slpk source initializes');
  t.end();
});
