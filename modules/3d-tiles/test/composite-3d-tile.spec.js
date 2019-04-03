/* eslint-disable max-len */

// NOTICE: This file was forked from
// https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Specs/Scene/Composite3DTileContentSpec.js
// which is under Apache 2 license

import test from 'tape-promise/tape';
import {fetchFile, parseFile, parseFileSync} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {encodeComposite3DTile, encodeInstancedModel3DTile} from '@loaders.gl/3d-tiles';

const COMPOSITE_URL = './Data/Cesium3DTiles/Composite/Composite/tileset.json';
const COMPOSITE_OF_COMPOSITE_URL =
  './Data/Cesium3DTiles/Composite/CompositeOfComposite/tileset.json';
const COMPOSITE_OF_INSTANCED_URL =
  './Data/Cesium3DTiles/Composite/CompositeOfInstanced/tileset.json';

test('composite tile#invalid version', t => {
  const arrayBuffer = encodeComposite3DTile({
    version: 2
  });
  t.throws(
    () => parseFileSync(arrayBuffer, Tile3DLoader),
    'load(composite tile) throws on wrong version'
  );
  t.end();
});

test('composite tile#invalid inner tile content type', t => {
  const arrayBuffer = encodeComposite3DTile({
    tiles: [
      encodeInstancedModel3DTile({
        magic: [120, 120, 120, 120]
      })
    ]
  });
  t.throws(
    () => parseFile(arrayBuffer, Tile3DLoader),
    'load(composite tile) throws on wrong magic'
  );
  t.end();
});

test('composite tile#loads from file', async t => {
  const tile = await parseFile(fetchFile(COMPOSITE_URL), Tile3DLoader);
  t.ok(tile, 'loaded tile');
  t.end();
});

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
    () => parseFile(arrayBuffer, Tile3DLoader),
    'load(composite tile) throws on nested invalid url'
  );
  t.end();
});

test('composite tile#loads composite', async t => {
  const tileset = await parseFile(fetchFile(COMPOSITE_URL), Tile3DLoader);
  t.ok(tileset, 'loaded');
  t.end();
});

test('composite tile#loads composite of composite', async t => {
  const tileset = await parseFile(fetchFile(COMPOSITE_OF_COMPOSITE_URL), Tile3DLoader);
  t.ok(tileset, 'loaded');
  t.end();
});

// TODO  should be a render test
test('renders multiple instanced tilesets', async t => {
  const tileset = await parseFile(fetchFile(COMPOSITE_OF_INSTANCED_URL), Tile3DLoader);
  t.ok(tileset, 'loaded');
  t.end();
});
