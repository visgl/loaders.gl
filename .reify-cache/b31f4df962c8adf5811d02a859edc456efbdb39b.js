"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var parseSync,encodeSync;module.link('@loaders.gl/core',{parseSync(v){parseSync=v},encodeSync(v){encodeSync=v}},1);var Tile3DLoader,Tile3DWriter,TILE3D_TYPE;module.link('@loaders.gl/3d-tiles',{Tile3DLoader(v){Tile3DLoader=v},Tile3DWriter(v){Tile3DWriter=v},TILE3D_TYPE(v){TILE3D_TYPE=v}},2);var loadRootTileFromTileset;module.link('../utils/load-utils',{loadRootTileFromTileset(v){loadRootTileFromTileset=v}},3);/* eslint-disable max-len */

// NOTICE: This file was forked from
// https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Specs/Scene/Composite3DTileContentSpec.js
// which is under Apache 2 license






const COMPOSITE_URL = '@loaders.gl/3d-tiles/test/data/Composite/Composite/tileset.json';
const COMPOSITE_OF_COMPOSITE_URL =
  '@loaders.gl/3d-tiles/test/data/Composite/CompositeOfComposite/tileset.json';
const COMPOSITE_OF_INSTANCED_URL =
  '@loaders.gl/3d-tiles/test/data/Composite/CompositeOfInstanced/tileset.json';

test('composite tile#invalid version', t => {
  const TILE = {
    type: TILE3D_TYPE.COMPOSITE,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => parseSync(arrayBuffer, Tile3DLoader),
    'load(composite tile) throws on wrong version'
  );
  t.end();
});

test('composite tile#invalid inner tile content type', t => {
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
    () => parseSync(arrayBuffer, Tile3DLoader),
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
    () => parseSync(arrayBuffer, Tile3DLoader),
    'load(composite tile) throws on nested invalid url'
  );
  t.end();
});
*/

test('composite tile#loads from file', async t => {
  const tileData = await loadRootTileFromTileset(t, COMPOSITE_URL);
  const tile = parseSync(tileData, Tile3DLoader);
  t.ok(tile, 'loaded tile');
  t.end();
});

test('composite tile#loads composite', async t => {
  const tileData = await loadRootTileFromTileset(t, COMPOSITE_URL);
  const tile = parseSync(tileData, Tile3DLoader);
  t.ok(tile, 'loaded');
  t.end();
});

test('composite tile#loads composite of composite', async t => {
  const tileData = await loadRootTileFromTileset(t, COMPOSITE_OF_COMPOSITE_URL);
  const tile = parseSync(tileData, Tile3DLoader);
  t.ok(tile, 'loaded');
  t.end();
});

// TODO  should be a render test
test('renders multiple instanced tilesets', async t => {
  const tileData = await loadRootTileFromTileset(t, COMPOSITE_OF_INSTANCED_URL);
  const tile = parseSync(tileData, Tile3DLoader);
  t.ok(tile, 'loaded');
  t.end();
});
