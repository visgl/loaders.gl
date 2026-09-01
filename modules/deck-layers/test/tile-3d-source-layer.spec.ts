// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Tiles3DArchiveFileLoader, Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {I3SLoader, SLPKLoader} from '@loaders.gl/i3s';
import {I3SSource, Tile3D, Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {createSource, Tile3DSourceLayer} from '@loaders.gl/deck-layers';
import {inferTilesetLoader} from '../src/tile-3d-source-layer';
import {loadArrayBufferFromFile} from 'test/utils/readable-files';
import {
  createSLPKArchiveResolver,
  createTiles3DArchiveResolver
} from '../src/archive-source-resolver';
const TILES_ARCHIVE_URL = '@loaders.gl/3d-tiles/test/data/test.3tz';
const SLPK_ARCHIVE_URL = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
test('createSource#selects Tiles3DSource for 3tz urls', () => {
  const source = createSource('https://example.com/data/test.3tz', Tiles3DLoader, {});
  expect(source instanceof Tiles3DSource).toBeTruthy();
});
test('createSource#selects I3SSource for slpk urls', () => {
  const source = createSource('https://example.com/data/test.slpk', I3SLoader, {});
  expect(source instanceof I3SSource).toBeTruthy();
});
test('createSource#normalizes archive loaders to standard source classes', () => {
  const tiles3DSource = createSource(
    'https://example.com/data/test.3tz',
    Tiles3DArchiveFileLoader,
    {}
  );
  const i3sSource = createSource('https://example.com/data/test.slpk', SLPKLoader, {});
  expect(tiles3DSource instanceof Tiles3DSource).toBeTruthy();
  expect(i3sSource instanceof I3SSource).toBeTruthy();
});
test('createSource#keeps non-archive loaders on standard source classes', () => {
  const tiles3DSource = createSource('https://example.com/data/tileset.json', Tiles3DLoader, {});
  const i3sSource = createSource('https://example.com/data/layers/0', I3SLoader, {});
  expect(tiles3DSource instanceof Tiles3DSource).toBeTruthy();
  expect(i3sSource instanceof I3SSource).toBeTruthy();
});
test('inferTilesetLoader#recognizes extensionless ArcGIS SceneServer urls', () => {
  const loader = inferTilesetLoader(
    'https://example.com/arcgis/rest/services/Buildings/SceneServer/layers/0?f=json',
    [Tiles3DLoader, I3SLoader]
  );
  expect(loader).toBe(I3SLoader);
});
test('inferTilesetLoader#does not guess from ambiguous urls', () => {
  const loader = inferTilesetLoader('https://example.com/root.json', [Tiles3DLoader, I3SLoader]);
  expect(loader).toBeUndefined();
});
test('Tile3DSourceLayer#accepts source-backed data', () => {
  const source = createSource('https://example.com/data/test.slpk', SLPKLoader, {});
  const layer = new Tile3DSourceLayer({id: 'slpk-source-layer', data: source});
  expect(layer.props.data, 'preserves the source passed through the data prop').toBe(source);
});
test('Tile3DSourceLayer#installs source loading on every layer instance', () => {
  const firstLayer = new Tile3DSourceLayer({
    id: 'switchable-source-layer',
    data: 'https://example.com/first/tileset.json'
  });
  const replacementLayer = new Tile3DSourceLayer({
    id: 'switchable-source-layer',
    data: 'https://example.com/second/tileset.json'
  });
  expect((firstLayer as any)._loadTileset).toBeTypeOf('function');
  expect((replacementLayer as any)._loadTileset).toBeTypeOf('function');
  expect((replacementLayer as any)._loadTileset).not.toBe((firstLayer as any)._loadTileset);
});
test('createSource#initializes Tileset3D from a 3tz url', async () => {
  const source = createSource(TILES_ARCHIVE_URL, Tiles3DLoader, {});
  const tileset = new Tileset3D(source);
  await tileset.tilesetInitializationPromise;
  expect(tileset.root, 'root tile created from archive metadata').toBeTruthy();
  expect(tileset.asset.version, 'archive metadata parsed through Tiles3DSource').toBe('1.0');
  await tileset._loadTile(tileset.root as Tile3D);
  expect(
    tileset.root?.content,
    'tile content loaded through the reused archive accessor'
  ).toBeTruthy();
});
test('createSource#initializes Tileset3D from an slpk url', async () => {
  const source = createSource(SLPK_ARCHIVE_URL, I3SLoader, {});
  const tileset = new Tileset3D(source);
  await tileset.tilesetInitializationPromise;
  expect(tileset.root, 'root tile created from SLPK metadata').toBeTruthy();
  const childHeader = await source.loadChildTileHeader?.(tileset.root as Tile3D, '3', {} as any);
  expect(childHeader?.id, 'child headers load through the reused SLPK accessor').toBe('3');
});
test('archive resolvers support blob-backed 3tz and slpk inputs', async () => {
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
  expect(tiles3DTileset.asset.version, 'blob-backed 3tz source initializes').toBe('1.0');
  expect(i3sTileset.root, 'blob-backed slpk source initializes').toBeTruthy();
});
