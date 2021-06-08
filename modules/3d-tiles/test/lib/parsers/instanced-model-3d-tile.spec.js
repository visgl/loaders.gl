// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parse, encodeSync} from '@loaders.gl/core';
import {Tiles3DLoader, Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {loadRootTileFromTileset} from '../utils/load-utils';

const GLTF_EXTERNAL_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedGltfExternal/tileset.json';
const WITH_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedWithBatchTable/tileset.json';
const WITH_BATCH_TABLE_BINARY_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedWithBatchTableBinary/tileset.json';
const WITHOUT_BATCH_TABLE_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedWithoutBatchTable/tileset.json';
const ORIENTATION_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedOrientation/tileset.json';
// TODO - looks like original source code mixes up 16/32 in the name here?
const OCT16P_ORIENTATION_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedOct32POrientation/tileset.json';
const SCALE_URL = '@loaders.gl/3d-tiles/test/data/Instanced/InstancedScale/tileset.json';
const SCALE_NON_UNIFORM_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedScaleNonUniform/tileset.json';
const RTC_URL = '@loaders.gl/3d-tiles/test/data/Instanced/InstancedRTC/tileset.json';
const QUANTIZED_URL = '@loaders.gl/3d-tiles/test/data/Instanced/InstancedQuantized/tileset.json';
const QUANTIZED_OCT32_PORIENTATION_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedQuantizedOct32POrientation/tileset.json';
const WITH_TRANSFORM_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedWithTransform/tileset.json';
const WITH_BATCH_IDS_URL =
  '@loaders.gl/3d-tiles/test/data/Instanced/InstancedWithBatchIds/tileset.json';
const TEXTURED_URL = '@loaders.gl/3d-tiles/test/data/Instanced/InstancedTextured/tileset.json';

const NO_GLTF = {
  '3d-tiles': {
    loadGLTF: false
  }
};

test('instanced model tile#does not throw with valid format', async (t) => {
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL,
    gltfFormat: 1
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await t.doesNotReject(parse(arrayBuffer, Tiles3DLoader, NO_GLTF), 'throws on invalid version');
  t.end();
});

test('instanced model tile#throws with invalid version', async (t) => {
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await t.rejects(
    parse(arrayBuffer, Tiles3DLoader, NO_GLTF),
    /Version/,
    'throws on invalid version'
  );
  t.end();
});

test('instanced model tile#throws with invalid format', async (t) => {
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL,
    gltfFormat: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await t.rejects(parse(arrayBuffer, Tiles3DLoader, NO_GLTF), 'throws on invalid version');
  t.end();
});

test('instanced model tile#throws with empty gltf', async (t) => {
  // Expect to throw DeveloperError in Model due to invalid gltf magic
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await t.rejects(parse(arrayBuffer, Tiles3DLoader), /valid loader/, 'throws with empty gltf');
  t.end();
});

test('instanced model tile#throws on invalid url', async (t) => {
  // Try loading a tile with an invalid url.
  // Expect promise to be rejected in Model, then in ModelInstanceCollection, and
  // finally in Instanced3DModel3DTileContent.
  const TILE = {
    type: TILE3D_TYPE.INSTANCED_3D_MODEL,
    gltfFormat: 0,
    gltfUri: 'not-a-real-path'
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  await t.rejects(parse(arrayBuffer, Tiles3DLoader), /url/, 'throws on invalid url');
  t.end();
});

test('instanced model tile#loaded tile without batch table', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITHOUT_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile without batch table');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with external gltf', async (t) => {
  const tileData = await loadRootTileFromTileset(t, GLTF_EXTERNAL_URL);
  const tile = await parse(tileData, Tiles3DLoader, {
    '3d-tiles': {
      // TODO - provide base URI?
      loadGLTF: false
    }
  });
  t.ok(tile, 'loaded tile with external gltf');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with batch table', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with batch table');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with batch table binary', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_BATCH_TABLE_BINARY_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile without batch table binary');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders without batch table', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITHOUT_BATCH_TABLE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile without batch table');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with feature defined orientation', async (t) => {
  const tileData = await loadRootTileFromTileset(t, ORIENTATION_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with feature defined orientation');
  t.end();
});

// TODO - this should be a render test
test.skip('instanced model tile#renders with feature defined Oct32P encoded orientation', async (t) => {
  const tileData = await loadRootTileFromTileset(t, OCT16P_ORIENTATION_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with feature defined Oct32P encoded orientation');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with feature defined scale', async (t) => {
  const tileData = await loadRootTileFromTileset(t, SCALE_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with feature defined scale');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with feature defined non-uniform scale', async (t) => {
  const tileData = await loadRootTileFromTileset(t, SCALE_NON_UNIFORM_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with feature defined non-uniform scale');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with RTC_CENTER semantic', async (t) => {
  const tileData = await loadRootTileFromTileset(t, RTC_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with RTC_CENTER semantic');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with feature defined quantized position', async (t) => {
  const tileData = await loadRootTileFromTileset(t, QUANTIZED_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with feature defined quantized position');
  t.end();
});

// TODO - this should be a render test
test.skip('instanced model tile#renders with feature defined quantized position and Oct32P encoded orientation', async (t) => {
  const tileData = await loadRootTileFromTileset(t, QUANTIZED_OCT32_PORIENTATION_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with feature defined quantized position and Oct32P encoded orientation');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with batch ids', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_BATCH_IDS_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with batch ids');
  t.end();
});

// TODO - this should be a render test
test('instanced model tile#renders with tile transform', async (t) => {
  const tileData = await loadRootTileFromTileset(t, WITH_TRANSFORM_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with tile transform');
  t.end();
  /*
  return Cesium3DTilesTester.loadTileset(scene, WITH_TRANSFORM_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);

    const newLongitude = -1.31962;
    const newLatitude = 0.698874;
    const newCenter = Cartesian3.fromRadians(newLongitude, newLatitude, 10.0);
    const newTransform = Transforms.headingPitchRollToFixedFrame(newCenter, new HeadingPitchRoll());

    // Update tile transform
    tileset.root.transform = newTransform;

    // Move the camera to the new location
    setCamera(newLongitude, newLatitude);
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
  });
  */
});

// TODO - this should be a render test
test('instanced model tile#renders with textures', async (t) => {
  const tileData = await loadRootTileFromTileset(t, TEXTURED_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded tile with textures');
  t.end();
});

/*
// TODO - this should be a render test
test('instanced model tile#renders in 2D', t => {
  return Cesium3DTilesTester.loadTileset(scene, GLTF_EXTERNAL_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
    tileset.maximumScreenSpaceError = 2.0;
    scene.morphTo2D(0.0);
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
  });
});

// TODO - this should be a render test
test('instanced model tile#renders in 2D with tile transform', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_TRANSFORM_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
    tileset.maximumScreenSpaceError = 2.0;
    scene.morphTo2D(0.0);
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
  });
});

// TODO - this should be a render test
test('instanced model tile#renders in CV', t => {
  return Cesium3DTilesTester.loadTileset(scene, GLTF_EXTERNAL_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
    scene.morphToColumbusView(0.0);
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
  });
});

// TODO - this should be a render test
test('instanced model tile#renders in CV with tile transform', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_TRANSFORM_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
    scene.morphToColumbusView(0.0);
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
  });
});

// TODO - this should be a render test
test('instanced model tile#renders when instancing is disabled', t => {
  // Disable extension
  const instancedArrays = scene.context._instancedArrays;
  scene.context._instancedArrays = undefined;

  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRenderTileset(scene, tileset);
    // Re-enable extension
    scene.context._instancedArrays = instancedArrays;
  });
});

// TODO - this should be a render test
test('instanced model tile#throws when calling getFeature with invalid index', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITHOUT_BATCH_TABLE_URL).then(function(tileset) {
    const content = tileset.root.content;
    expect(function() {
      content.getFeature(-1);
    }).toThrowDeveloperError();
    expect(function() {
      content.getFeature(10000);
    }).toThrowDeveloperError();
    expect(function() {
      content.getFeature();
    }).toThrowDeveloperError();
  });
});

/*
test('instanced model tile#gets memory usage', t => {
  return Cesium3DTilesTester.loadTileset(scene, TEXTURED_URL).then(function(tileset) {
    const content = tileset.root.content;

    // Box model - 36 ushort indices and 24 vertices per building, 8 float components (position, normal, uv) per vertex.
    // (24 * 8 * 4) + (36 * 2) = 840
    const geometryByteLength = 840;

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

test('instanced model tile#Links model to tileset clipping planes based on bounding volume clipping', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(function(tileset) {
    const tile = tileset.root;
    const content = tile.content;
    const model = content._modelInstanceCollection._model;

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

test('instanced model tile#Links model to tileset clipping planes if tileset clipping planes are reassigned', t => {
  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(function(tileset) {
    const tile = tileset.root;
    const model = tile.content._modelInstanceCollection._model;

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

test('instanced model tile#rebuilds Model shaders when clipping planes change', t => {
  spyOn(Model, '_getClippingFunction').and.callThrough();

  return Cesium3DTilesTester.loadTileset(scene, WITH_BATCH_TABLE_URL).then(function(tileset) {
    const tile = tileset.root;
    const content = tile.content;
    const clippingPlaneCollection = new ClippingPlaneCollection({
      planes : [
        new ClippingPlane(Cartesian3.UNIT_X, 0.0)
      ]
    });
    tileset.clippingPlanes = clippingPlaneCollection;
    clippingPlaneCollection.update(scene.frameState);
    content.clippingPlanesDirty = true;
    tile.update(tileset, scene.frameState);

    expect(Model._getClippingFunction.calls.count()).toEqual(1);
  });
});

test('instanced model tile#destroys', t => {
  return Cesium3DTilesTester.tileDestroys(scene, WITHOUT_BATCH_TABLE_URL);
});
*/
