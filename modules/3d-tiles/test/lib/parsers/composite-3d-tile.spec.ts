// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {expect, test} from 'vitest';
import {encodeSync, load, parse, parseSync} from '@loaders.gl/core';
import {Tiles3DLoader, Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {loadRootTileFromTileset} from '../utils/load-utils';
const COMPOSITE_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Composite/Composite/tileset.json';
const COMPOSITE_OF_COMPOSITE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Composite/CompositeOfComposite/tileset.json';
const COMPOSITE_OF_INSTANCED_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Composite/CompositeOfInstanced/tileset.json';
test('composite tile#invalid version', () => {
  const TILE = {
    type: TILE3D_TYPE.COMPOSITE,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  expect(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'load(composite tile) throws on wrong version'
  ).toThrow();
});
test('composite tile#invalid inner tile content type', () => {
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
  expect(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'load(composite tile) throws on wrong magic'
  ).toThrow();
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
test('composite tile#loads from file', async () => {
  const tileData = await loadRootTileFromTileset(COMPOSITE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile').toBeTruthy();
});
test('composite tile#loads composite', async () => {
  const tileData = await loadRootTileFromTileset(COMPOSITE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded').toBeTruthy();
});
test('composite tile#loads composite of composite', async () => {
  const tileData = await loadRootTileFromTileset(COMPOSITE_OF_COMPOSITE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded').toBeTruthy();
});
test('loads multiple instanced tiles from composite content', async () => {
  const tileset = await load(COMPOSITE_OF_INSTANCED_URL, Tiles3DLoader, {worker: false});
  const tile = await load(tileset.root.contentUrl, Tiles3DLoader, {
    worker: false,
    '3d-tiles': {loadGLTF: false}
  });
  expect(tile.tilesLength).toBe(2);
  expect(tile.tiles).toHaveLength(2);
});
