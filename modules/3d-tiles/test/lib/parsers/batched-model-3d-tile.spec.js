// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parse, encodeSync} from '@loaders.gl/core';
import {Tiles3DLoader, Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {ImageLoader} from '@loaders.gl/images';
import {loadRootTileFromTileset, loadRootTile} from '../utils/load-utils';

const EPSILON = 1e-12;

const WITH_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithBatchTable/tileset.json';
const WITH_Z_UP_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColorsZUp/tileset.json';
const WITH_BATCH_TABLE_BINARY_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithBatchTableBinary/tileset.json';
const WITHOUT_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithoutBatchTable/tileset.json';
const TRANSLUCENT_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedTranslucent/tileset.json';
const TRANSLUCENT_OPAQUE_MIX_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedTranslucentOpaqueMix/tileset.json';
const WITH_TRANSFORM_BOX_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformBox/tileset.json';
const WITH_TRANSFORM_SPHERE_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformSphere/tileset.json';
const WITH_TRANSFORM_REGION_URL =
  '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithTransformRegion/tileset.json';
const TEXTURED_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedTextured/tileset.json';
// const DEPRECATED1_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedDeprecated1/tileset.json';
// const DEPRECATED2_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedDeprecated2/tileset.json';
// const WITH_RTC_CENTER_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedWithRtcCenter/tileset.json';

test('batched model tile#throws with invalid version', async (t) => {
  const TILE = {
    type: TILE3D_TYPE.BATCHED_3D_MODEL,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.rejects(parse(arrayBuffer, Tiles3DLoader), 'throws on invalid version');
  t.end();
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

test('batched model tile#without batch table', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITHOUT_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile without batch table');
  t.end();
});

test('batched model tile#with batch table', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with batch table');
  t.end();
});

test('batched model tile#default gltfUpAxis is supported', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.equal(tile.gltfUpAxis, 'Y', 'tile has default gltf up axis');
  t.end();
});

test('batched model tile#validate rotate matrix for Y axis', async (t) => {
  const tile = await loadRootTile(t, WITH_BATCH_TABLE_URL);
  t.equal(tile.content.gltfUpAxis, 'Y', 'tile has default Y gltf up axis');
  // rotation matrix
  // 1  0  0  0
  // 0  0  1  0
  // 0 -1  0  0
  // x  y  z  1
  t.equal(tile.content.cartesianModelMatrix[0], 1);
  t.equal(tile.content.cartesianModelMatrix[6], 1);
  t.equal(tile.content.cartesianModelMatrix[9], -1);
  t.equal(tile.content.cartesianModelMatrix[15], 1);
  t.equal(Math.round(tile.content.cartesianModelMatrix[5] * EPSILON) / EPSILON, 0);
  t.equal(Math.round(tile.content.cartesianModelMatrix[10] * EPSILON) / EPSILON, 0);
  t.end();
});

test('batched model tile#validate rotate matrix for Z axis', async (t) => {
  const tile = await loadRootTile(t, WITH_Z_UP_URL);
  t.equal(tile.content.gltfUpAxis, 'Z', 'tile has Z gltf up axis');
  // matrix without rotation
  // 1  0  0  0
  // 0  1  0  0
  // 0  0  1  0
  // 0  0  0  1
  t.equal(tile.content.cartesianModelMatrix[0], 1);
  t.equal(tile.content.cartesianModelMatrix[5], 1);
  t.equal(tile.content.cartesianModelMatrix[10], 1);
  t.equal(tile.content.cartesianModelMatrix[15], 1);
  t.end();
});

test('batched model tile#with batch table binary', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_BATCH_TABLE_BINARY_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with batch table binary');
  t.end();
});

test('batched model tile#without batch table', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITHOUT_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with batch table binary');
  t.end();
});

// TODO this should be a render test
test('batched model tile#with all features translucent', async (t) => {
  const tileData = await loadRootTileFromTileset(t, TRANSLUCENT_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with all features translucent');
  t.end();
});

// TODO this should be a render test
test('batched model tile#with a mix of opaque and translucent features', async (t) => {
  const tileData = await loadRootTileFromTileset(t, TRANSLUCENT_OPAQUE_MIX_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with a mix of opaque and translucent features');
  t.end();
});

// TODO this should be a render test
test('batched model tile#with textures', async (t) => {
  const tileData = await loadRootTileFromTileset(t, TEXTURED_URL);
  const tile = await parse(tileData, [Tiles3DLoader, ImageLoader]);
  t.ok(tile, 'loaded tile with a mix of opaque and translucent features');
  t.end();
});

// TODO this should be a render test
test('batched model tile#with a tile transform and box bounding volume', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_TRANSFORM_BOX_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with a tile transform and box bounding volume');
  t.end();
});

// TODO this should be a render test
test('batched model tile#with a tile transform and sphere bounding volume', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_TRANSFORM_SPHERE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with a tile transform and sphere bounding volume');
  t.end();
});

// TODO this should be a render test
test('batched model tile#with a tile transform and region bounding volume', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_TRANSFORM_REGION_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with a tile transform and region bounding volume');
  t.end();
});

/*
test('can get features and properties', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(function(tileset) {
    const content = tileset.root.content;
    expect(content.featuresLength).toBe(10);
    expect(content.innerContents).toBeUndefined();
    expect(content.hasProperty(0, 'id')).toBe(true);
    expect(content.getFeature(0)).toBeDefined();
  });
});

test('throws when calling getFeature with invalid index', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(function(tileset) {
    const content = tileset.root.content;
    expect(function(){
      content.getFeature(-1);
    }).toThrowDeveloperError();
    expect(function(){
      content.getFeature(1000);
    }).toThrowDeveloperError();
    expect(function(){
      content.getFeature();
    }).toThrowDeveloperError();
  });
});

test('gets memory usage', t => {
  return Cesium3DTilesTester.loadTileset(scene, TEXTURED_URL).then(function(tileset) {
    const content = tileset.root.content;

    // 10 buildings, 36 ushort indices and 24 vertices per building, 8 float components (position, normal, uv) and 1 uint component (batchId) per vertex.
    // 10 * ((24 * (8 * 4 + 1 * 4)) + (36 * 2)) = 9360
    const geometryByteLength = 9360;

    // Texture is 128x128 RGBA bytes, not mipmapped
    const texturesByteLength = 65536;

    // One RGBA byte pixel per feature
    const batchTexturesByteLength = content.featuresLength * 4;
    const pickTexturesByteLength = content.featuresLength * 4;

    // Features have not been picked or colored yet, so the batch table contribution is 0.
    expect(content.geometryByteLength).toEqual(geometryByteLength);
    expect(content.texturesByteLength).toEqual(texturesByteLength);
    expect(content.batchTableByteLength).toEqual(0);

    // Color a feature and expect the texture memory to increase
    content.getFeature(0).color = Color.RED;
    scene.renderForSpecs();
    expect(content.geometryByteLength).toEqual(geometryByteLength);
    expect(content.texturesByteLength).toEqual(texturesByteLength);
    expect(content.batchTableByteLength).toEqual(batchTexturesByteLength);

    // Pick the tile and expect the texture memory to increase
    scene.pickForSpecs();
    expect(content.geometryByteLength).toEqual(geometryByteLength);
    expect(content.texturesByteLength).toEqual(texturesByteLength);
    expect(content.batchTableByteLength).toEqual(batchTexturesByteLength + pickTexturesByteLength);
  });
});

test('Links model to tileset clipping planes based on bounding volume clipping', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(function(tileset) {
    const tile = tileset.root;
    const content = tile.content;
    const model = content._model;

    expect(model.clippingPlanes).toBeUndefined();

    const clippingPlaneCollection = new ClippingPlaneCollection({
      planes : [
        new ClippingPlane(Cartesian3.UNIT_X, 0.0)
      ]
    });
    tileset.clippingPlanes = clippingPlaneCollection;
    clippingPlaneCollection.update(scene.frameState);
    tile.update(tileset, scene.frameState);

    expect(model.clippingPlanes).toBeDefined();
    expect(model.clippingPlanes).toBe(tileset.clippingPlanes);

    tile._isClipped = false;
    tile.update(tileset, scene.frameState);

    expect(model.clippingPlanes).toBeUndefined();
  });
});

test('Links model to tileset clipping planes if tileset clipping planes are reassigned', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(function(tileset) {
    const tile = tileset.root;
    const model = tile.content._model;

    expect(model.clippingPlanes).toBeUndefined();

    const clippingPlaneCollection = new ClippingPlaneCollection({
      planes : [
        new ClippingPlane(Cartesian3.UNIT_X, 0.0)
      ]
    });
    tileset.clippingPlanes = clippingPlaneCollection;
    clippingPlaneCollection.update(scene.frameState);
    tile.update(tileset, scene.frameState);

    expect(model.clippingPlanes).toBeDefined();
    expect(model.clippingPlanes).toBe(tileset.clippingPlanes);

    const newClippingPlaneCollection = new ClippingPlaneCollection({
      planes : [
        new ClippingPlane(Cartesian3.UNIT_X, 0.0)
      ]
    });
    tileset.clippingPlanes = newClippingPlaneCollection;
    newClippingPlaneCollection.update(scene.frameState);
    expect(model.clippingPlanes).not.toBe(tileset.clippingPlanes);

    tile.update(tileset, scene.frameState);
    expect(model.clippingPlanes).toBe(tileset.clippingPlanes);
  });
});

test('rebuilds Model shaders when clipping planes change', t => {
  spyOn(Model, '_getClippingFunction').and.callThrough();

  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(function(tileset) {
    const tile = tileset.root;

    const clippingPlaneCollection = new ClippingPlaneCollection({
      planes : [
        new ClippingPlane(Cartesian3.UNIT_X, 0.0)
      ]
    });
    tileset.clippingPlanes = clippingPlaneCollection;
    clippingPlaneCollection.update(scene.frameState);
    tile.update(tileset, scene.frameState);

    expect(Model._getClippingFunction.calls.count()).toEqual(1);
  });
});

test('transforms model positions by RTC_CENTER property in the features table', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_RTC_CENTER_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);

    const rtcTransform = tileset.root.content._rtcCenterTransform;
    expect(rtcTransform).toEqual(Matrix4.fromTranslation(new Cartesian3(0.1, 0.2, 0.3)));

    const expectedModelTransform = Matrix4.multiply(tileset.root.transform, rtcTransform, new Matrix4());
    expect(tileset.root.content._contentModelMatrix).toEqual(expectedModelTransform);
    expect(tileset.root.content._model._modelMatrix).toEqual(expectedModelTransform);

     // Update tile transform
    const newLongitude = -1.31962;
    const newLatitude = 0.698874;
    const newCenter = Cartesian3.fromRadians(newLongitude, newLatitude, 0.0);
    const newHPR = new HeadingPitchRoll();
    const newTransform = Transforms.headingPitchRollToFixedFrame(newCenter, newHPR);
    tileset.root.transform = newTransform;
    scene.camera.lookAt(newCenter, new HeadingPitchRange(0.0, 0.0, 15.0));
    scene.renderForSpecs();

    expectedModelTransform = Matrix4.multiply(tileset.root.computedTransform, rtcTransform, expectedModelTransform);
    expect(tileset.root.content._model._modelMatrix).toEqual(expectedModelTransform);
  });
});

test('picks with batch table', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(function(tileset) {
    const content = tileset.root.content;
    tileset.show = false;
    expect(scene).toPickPrimitive(undefined);
    tileset.show = true;
    expect(scene).toPickAndCall(function(result) {
      expect(result).toBeDefined();
      expect(result.primitive).toBe(tileset);
      expect(result.content).toBe(content);
    });
  });
});

test('picks without batch table', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(function(tileset) {
    const content = tileset.root.content;
    tileset.show = false;
    expect(scene).toPickPrimitive(undefined);
    tileset.show = true;
    expect(scene).toPickAndCall(function(result) {
      expect(result).toBeDefined();
      expect(result.primitive).toBe(tileset);
      expect(result.content).toBe(content);
    });
  });
});
*/
