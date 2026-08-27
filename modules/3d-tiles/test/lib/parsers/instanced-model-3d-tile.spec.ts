// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {expect, test} from 'vitest';
import {parse, encodeSync} from '@loaders.gl/core';
import {Tiles3DLoader, Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {loadRootTileFromTileset} from '../utils/load-utils';
const GLTF_EXTERNAL_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedGltfExternal/tileset.json';
const WITH_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedWithBatchTable/tileset.json';
const WITH_BATCH_TABLE_BINARY_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedWithBatchTableBinary/tileset.json';
const WITHOUT_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedWithoutBatchTable/tileset.json';
const ORIENTATION_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedOrientation/tileset.json';
// TODO - looks like original source code mixes up 16/32 in the name here?
const OCT16P_ORIENTATION_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedOct32POrientation/tileset.json';
const SCALE_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedScale/tileset.json';
const SCALE_NON_UNIFORM_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedScaleNonUniform/tileset.json';
const RTC_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedRTC/tileset.json';
const QUANTIZED_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedQuantized/tileset.json';
const QUANTIZED_OCT32_PORIENTATION_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedQuantizedOct32POrientation/tileset.json';
const WITH_TRANSFORM_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedWithTransform/tileset.json';
const WITH_BATCH_IDS_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedWithBatchIds/tileset.json';
const TEXTURED_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Instanced/InstancedTextured/tileset.json';
const NO_GLTF = {
  '3d-tiles': {
    loadGLTF: false
  }
};
test('instanced model tile#does not throw with valid format', async () => {
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL,
    gltfFormat: 1
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await await expect(
    parse(arrayBuffer, Tiles3DLoader, NO_GLTF),
    'throws on invalid version'
  ).resolves.toBeDefined();
});
test('instanced model tile#throws with invalid version', async () => {
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await await expect(
    parse(arrayBuffer, Tiles3DLoader, NO_GLTF),
    'throws on invalid version'
  ).rejects.toThrow(/Version/);
});
test('instanced model tile#throws with invalid format', async () => {
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL,
    gltfFormat: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await await expect(
    parse(arrayBuffer, Tiles3DLoader, NO_GLTF),
    'throws on invalid version'
  ).rejects.toBeDefined();
});
test('instanced model tile#throws with empty gltf', async () => {
  // Expect to throw DeveloperError in Model due to invalid gltf magic
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await await expect(
    parse(arrayBuffer, Tiles3DLoader),
    // /valid loader/,
    'throws with empty gltf'
  ).rejects.toBeDefined();
});
test('instanced model tile#throws on invalid url', async () => {
  // Try loading a tile with an invalid url.
  // Expect promise to be rejected in Model, then in ModelInstanceCollection, and
  // finally in Instanced3DModel3DTileContent.
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL,
    gltfFormat: 0,
    gltfUri: 'not-a-real-path'
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await await expect(
    parse(arrayBuffer, Tiles3DLoader),
    // /No valid loader found/,
    'throws on invalid url'
  ).rejects.toBeDefined();
});
test('instanced model tile#loaded tile without batch table', async () => {
  const tileData = await loadRootTileFromTileset(WITHOUT_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile without batch table').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with external gltf', async () => {
  const tileData = await loadRootTileFromTileset(GLTF_EXTERNAL_URL);
  const tile = await parse(tileData, Tiles3DLoader, {
    '3d-tiles': {
      // TODO - provide base URI?
      loadGLTF: false
    }
  });
  expect(tile, 'loaded tile with external gltf').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with batch table', async () => {
  const tileData = await loadRootTileFromTileset(WITH_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with batch table').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with batch table binary', async () => {
  const tileData = await loadRootTileFromTileset(WITH_BATCH_TABLE_BINARY_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile without batch table binary').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders without batch table', async () => {
  const tileData = await loadRootTileFromTileset(WITHOUT_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile without batch table').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with feature defined orientation', async () => {
  const tileData = await loadRootTileFromTileset(ORIENTATION_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with feature defined orientation').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with feature defined Oct32P encoded orientation', async () => {
  const tileData = await loadRootTileFromTileset(OCT16P_ORIENTATION_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with feature defined Oct32P encoded orientation').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with feature defined scale', async () => {
  const tileData = await loadRootTileFromTileset(SCALE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with feature defined scale').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with feature defined non-uniform scale', async () => {
  const tileData = await loadRootTileFromTileset(SCALE_NON_UNIFORM_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with feature defined non-uniform scale').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with RTC_CENTER semantic', async () => {
  const tileData = await loadRootTileFromTileset(RTC_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with RTC_CENTER semantic').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with feature defined quantized position', async () => {
  const tileData = await loadRootTileFromTileset(QUANTIZED_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with feature defined quantized position').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with feature defined quantized position and Oct32P encoded orientation', async () => {
  const tileData = await loadRootTileFromTileset(QUANTIZED_OCT32_PORIENTATION_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(
    tile,
    'loaded tile with feature defined quantized position and Oct32P encoded orientation'
  ).toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with batch ids', async () => {
  const tileData = await loadRootTileFromTileset(WITH_BATCH_IDS_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with batch ids').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with tile transform', async () => {
  const tileData = await loadRootTileFromTileset(WITH_TRANSFORM_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with tile transform').toBeTruthy();
});
// TODO - this should be a render test
test('instanced model tile#renders with textures', async () => {
  const tileData = await loadRootTileFromTileset(TEXTURED_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with textures').toBeTruthy();
});
