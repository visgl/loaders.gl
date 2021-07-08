// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parse, parseSync, encodeSync} from '@loaders.gl/core';
import {Tiles3DLoader, Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {loadRootTileFromTileset} from '../utils/load-utils';

const COMPOSITE_URL = '@loaders.gl/3d-tiles/test/data/Composite/Composite/tileset.json';
const COMPOSITE_OF_COMPOSITE_URL =
  '@loaders.gl/3d-tiles/test/data/Composite/CompositeOfComposite/tileset.json';
const COMPOSITE_OF_INSTANCED_URL =
  '@loaders.gl/3d-tiles/test/data/Composite/CompositeOfInstanced/tileset.json';

test('composite tile#invalid version', (t) => {
  const TILE = {
    type: TILE3D_TYPE.COMPOSITE,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'load(composite tile) throws on wrong version'
  );
  t.end();
});

test('composite tile#invalid inner tile content type', (t) => {
  const TILE = {
    type: TILE3D_TYPE.COMPOSITE,
    tiles: [
      {
        type: TILE3D_TYPE.INSTANCED_3D_MODEL,
        magic: [120, 120, 120, 120]
      }
    ]
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'load(composite tile) throws on wrong magic'
  );
  t.end();
});

/*
test('composite tile#composite tile with an instanced tile that has an invalid url', t => {
  const arrayBuffer = encodeComposite3DTile({
    tiles: [
      encodeInstancedModel3DTile({
        gltfFormat: 0,
        gltfUri: 'invalid'
      })
    ]
  });
  t.throws(
    () => await parse(arrayBuffer, Tiles3DLoader),
    'load(composite tile) throws on nested invalid url'
  );
  t.end();
});
*/

test('composite tile#loads from file', async (t) => {
  const tileData = await loadRootTileFromTileset(t, COMPOSITE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile');
  t.end();
});

test('composite tile#loads composite', async (t) => {
  const tileData = await loadRootTileFromTileset(t, COMPOSITE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded');
  t.end();
});

test('composite tile#loads composite of composite', async (t) => {
  const tileData = await loadRootTileFromTileset(t, COMPOSITE_OF_COMPOSITE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded');
  t.end();
});

// TODO  should be a render test
test.skip('renders multiple instanced tilesets', async (t) => {
  const tileData = await loadRootTileFromTileset(t, COMPOSITE_OF_INSTANCED_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded');
  t.end();
});
