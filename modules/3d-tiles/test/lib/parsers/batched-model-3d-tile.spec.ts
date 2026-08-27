// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {expect, test} from 'vitest';
import {parse, encodeSync, fetchFile} from '@loaders.gl/core';
import {Tiles3DLoader, Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {ImageBitmapLoader} from '@loaders.gl/images';
import {loadRootTileFromTileset, loadRootTile} from '../utils/load-utils';
const EPSILON = 1e-12;
const WITH_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithBatchTable/tileset.json';
const WITH_Z_UP_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedColorsZUp/tileset.json';
const WITH_BATCH_TABLE_BINARY_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithBatchTableBinary/tileset.json';
const WITHOUT_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithoutBatchTable/tileset.json';
const TRANSLUCENT_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedTranslucent/tileset.json';
const TRANSLUCENT_OPAQUE_MIX_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedTranslucentOpaqueMix/tileset.json';
const WITH_TRANSFORM_BOX_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithTransformBox/tileset.json';
const WITH_TRANSFORM_SPHERE_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithTransformSphere/tileset.json';
const WITH_TRANSFORM_REGION_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithTransformRegion/tileset.json';
const TEXTURED_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedTextured/tileset.json';
// const DEPRECATED1_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedDeprecated1/tileset.json';
// const DEPRECATED2_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedDeprecated2/tileset.json';
// const WITH_RTC_CENTER_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedWithRtcCenter/tileset.json';
const CESIUM_RTC_EXTENSION_URL = '@loaders.gl/3d-tiles/test/data/cesium-rtc-extension.b3dm';
test('batched model tile#throws with invalid version', async () => {
  const TILE = {
    type: TILE3D_TYPE.BATCHED_3D_MODEL,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await expect(
    parse(arrayBuffer, Tiles3DLoader),
    'throws on invalid version'
  ).rejects.toBeDefined();
});
/*
test('batched model tile#recognizes the legacy 20-byte header', t => {
  t.throws(() => parse(fetchFile(DEPRECATED1_URL), Tiles3DLoader), 'throws on legacy header');
  t.end();
});

test('batched model tile#recognizes the legacy 24-byte header', t => {
  t.throws(() => parse(fetchFile(DEPRECATED2_URL), Tiles3DLoader), 'throws on legacy header');
  t.end();
});
*/
// test('batched model tile#logs deprecation warning for use of BATCHID without prefixed underscore', t => {
//   return Cesium3DTilesTester.loadTileset(scene, DEPRECATED1_URL)
//     .then(function(tileset) {
//       expect(Batched3DModel3DTileContent._deprecationWarning).toHaveBeenCalled();
//       Cesium3DTilesTester.expectRenderTileset(scene, tileset);
//     });
// });
/*
test('batched model tile#empty gltf', async t => {
  // Expect to throw DeveloperError in Model due to invalid gltf magic
  const TILE = {
    type: TILE3D_TYPE.BATCHED_3D_MODEL
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(() => await parse(arrayBuffer, Tiles3DLoader), 'Throws with empty glTF');
  t.end();
});
*/
test('batched model tile#without batch table', async () => {
  const tileData = await loadRootTileFromTileset(WITHOUT_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile without batch table').toBeTruthy();
});
test('batched model tile#with batch table', async () => {
  const tileData = await loadRootTileFromTileset(WITH_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with batch table').toBeTruthy();
});
test('batched model tile#default gltfUpAxis is supported', async () => {
  const tileData = await loadRootTileFromTileset(WITH_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile.gltfUpAxis, 'tile has default gltf up axis').toBe('Y');
});
test('batched model tile#validate rotate matrix for Y axis', async () => {
  const tile = await loadRootTile(WITH_BATCH_TABLE_URL);
  expect(tile.content.gltfUpAxis, 'tile has default Y gltf up axis').toBe('Y');
  // rotation matrix
  // 1  0  0  0
  // 0  0  1  0
  // 0 -1  0  0
  // x  y  z  1
  expect(tile.content.cartesianModelMatrix[0]).toBe(1);
  expect(tile.content.cartesianModelMatrix[6]).toBe(1);
  expect(tile.content.cartesianModelMatrix[9]).toBe(-1);
  expect(tile.content.cartesianModelMatrix[15]).toBe(1);
  expect(Math.round(tile.content.cartesianModelMatrix[5] * EPSILON) / EPSILON).toBe(0);
  expect(Math.round(tile.content.cartesianModelMatrix[10] * EPSILON) / EPSILON).toBe(0);
});
test('batched model tile#validate rotate matrix for Z axis', async () => {
  const tile = await loadRootTile(WITH_Z_UP_URL);
  expect(tile.content.gltfUpAxis, 'tile has Z gltf up axis').toBe('Z');
  // matrix without rotation
  // 1  0  0  0
  // 0  1  0  0
  // 0  0  1  0
  // 0  0  0  1
  expect(tile.content.cartesianModelMatrix[0]).toBe(1);
  expect(tile.content.cartesianModelMatrix[5]).toBe(1);
  expect(tile.content.cartesianModelMatrix[10]).toBe(1);
  expect(tile.content.cartesianModelMatrix[15]).toBe(1);
});
test('batched model tile#with batch table binary', async () => {
  const tileData = await loadRootTileFromTileset(WITH_BATCH_TABLE_BINARY_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with batch table binary').toBeTruthy();
});
test('batched model tile#without batch table', async () => {
  const tileData = await loadRootTileFromTileset(WITHOUT_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with batch table binary').toBeTruthy();
});
// TODO this should be a render test
test('batched model tile#with all features translucent', async () => {
  const tileData = await loadRootTileFromTileset(TRANSLUCENT_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with all features translucent').toBeTruthy();
});
// TODO this should be a render test
test('batched model tile#with a mix of opaque and translucent features', async () => {
  const tileData = await loadRootTileFromTileset(TRANSLUCENT_OPAQUE_MIX_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with a mix of opaque and translucent features').toBeTruthy();
});
// TODO this should be a render test
test('batched model tile#with textures', async () => {
  const tileData = await loadRootTileFromTileset(TEXTURED_URL);
  const tile = await parse(tileData, [Tiles3DLoader, ImageBitmapLoader]);
  expect(tile, 'loaded tile with a mix of opaque and translucent features').toBeTruthy();
});
// TODO this should be a render test
test('batched model tile#with a tile transform and box bounding volume', async () => {
  const tileData = await loadRootTileFromTileset(WITH_TRANSFORM_BOX_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with a tile transform and box bounding volume').toBeTruthy();
});
// TODO this should be a render test
test('batched model tile#with a tile transform and sphere bounding volume', async () => {
  const tileData = await loadRootTileFromTileset(WITH_TRANSFORM_SPHERE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with a tile transform and sphere bounding volume').toBeTruthy();
});
// TODO this should be a render test
test('batched model tile#with a tile transform and region bounding volume', async () => {
  const tileData = await loadRootTileFromTileset(WITH_TRANSFORM_REGION_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  expect(tile, 'loaded tile with a tile transform and region bounding volume').toBeTruthy();
});
test('batched model tile#Tile with CESIUM_RTC extension', async () => {
  const response = await fetchFile(CESIUM_RTC_EXTENSION_URL);
  const tile = await parse(response, Tiles3DLoader);
  expect(tile).toBeTruthy();
  expect(tile.rtcCenter).toBeTruthy();
  expect(tile.rtcCenter, 'Should load rtcCenter from extension').toEqual([
    -3958511.2845904976, 3351066.1484445883, 3699868.873688681
  ]);
});
