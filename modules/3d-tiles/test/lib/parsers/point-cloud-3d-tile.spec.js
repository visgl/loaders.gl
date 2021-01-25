// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parseSync, encodeSync} from '@loaders.gl/core';
import {Tiles3DLoader, Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {loadDraco} from '../../../src/lib/parsers/parse-3d-tile-point-cloud';
// import {loadRootTileFromTileset} from '../utils/load-utils';

/*
const POINTCLOUD_RGB_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB/tileset.json';
const POINTCLOUD_RGBA_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGBA/tileset.json';
const POINTCLOUD_RGB565_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB565/tileset.json';
const POINTCLOUD_NO_COLOR_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudNoColor/tileset.json';
const POINTCLOUD_CONSTANT_COLOR_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudConstantColor/tileset.json';
const POINTCLOUD_NORMALS_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudNormals/tileset.json';
const POINTCLOUD_NORMALS_OCT_ENCODED_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudNormalsOctEncoded/tileset.json';
const POINTCLOUD_QUANTIZED_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudQuantized/tileset.json';
const POINTCLOUD_QUANTIZED_OCT_ENCODED_URL =
  '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudQuantizedOctEncoded/tileset.json';
const POINTCLOUD_DRACO_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudDraco/tileset.json';
const POINTCLOUD_DRACO_PARTIAL_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudDracoPartial/tileset.json';
const POINTCLOUD_DRACO_BATCHED_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudDracoBatched/tileset.json';
const POINTCLOUD_WGS84_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudWGS84/tileset.json';
const POINTCLOUD_BATCHED_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudBatched/tileset.json';
const POINTCLOUD_WITH_PER_POINT_PROPERTIES_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudWithPerPointProperties/tileset.json';
const POINTCLOUD_WITH_TRANSFORM_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudWithTransform/tileset.json';
const POINTCLOUD_TILESET_URL = '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetPoints/tileset.json';
*/

test('point cloud tile#throws with invalid version', t => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(() => parseSync(arrayBuffer, Tiles3DLoader), 'throws on invalid version');
  t.end();
});

test('point cloud tile#throws if featureTableJsonByteLength is 0', t => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJsonByteLength: 0
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'throws if featureTableJsonByteLength is 0'
  );
  t.end();
});

test('point cloud tile#throws if the feature table does not contain POINTS_LENGTH', t => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJson: {
      POSITION: {
        byteOffset: 0
      }
    }
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'throws if the feature table does not contain POINTS_LENGTH'
  );
  t.end();
});

test('point cloud tile#throws if the feature table does not contain POSITION or POSITION_QUANTIZED', t => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJson: {
      POINTS_LENGTH: 1
    }
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'throws if feature table has no POSITION or POSITION_QUANTIZED'
  );
  t.end();
});

test('loadDraco# Pass options to draco loader properly', async t => {
  const resultObject = {
    draco: {
      decoderType: 'js',
      extraAttributes: {test: 'yes'}
    },
    worker: true,
    reuseWorkers: true
  };
  const tile = null;
  const context = {
    parse: async (buffer, loader, resultOptions) => {
      t.deepEqual(resultOptions, resultObject);
      t.equal(resultOptions['3d-tiles'], undefined);
      t.end();
    }
  };

  const dracoData = {buffer: null, batchTableProperties: {test: 'yes'}};
  const options = {
    draco: {
      decoderType: 'js'
    },
    '3d-tiles': 'test 3d-tiles',
    worker: true,
    reuseWorkers: true
  };
  await loadDraco(tile, dracoData, options, context);
});

/*
test('point cloud tile#throws if the positions are quantized and the feature table does not contain QUANTIZED_VOLUME_SCALE', t => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJson: {
      POINTS_LENGTH: 1,
      POSITION_QUANTIZED: {
        byteOffset: 0
      },
      QUANTIZED_VOLUME_OFFSET: [0.0, 0.0, 0.0]
    }
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => await parse(arrayBuffer, Tiles3DLoader),
    'throws if the positions are quantized and the feature table does not contain QUANTIZED_VOLUME_SCALE'
  );
  t.end();
});

test('point cloud tile#throws if the positions are quantized and the feature table does not contain QUANTIZED_VOLUME_OFFSET', t => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJson: {
      POINTS_LENGTH: 1,
      POSITION_QUANTIZED: {
        byteOffset: 0
      },
      QUANTIZED_VOLUME_SCALE: [1.0, 1.0, 1.0]
    }
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => await parse(arrayBuffer, Tiles3DLoader),
    'throws if the positions are quantized and the feature table does not contain QUANTIZED_VOLUME_OFFSET'
  );
  t.end();
});

test('point cloud tile#throws if the BATCH_ID semantic is defined but BATCHES_LENGTH is not', t => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJson: {
      POINTS_LENGTH: 2,
      POSITION: [0.0, 0.0, 0.0, 1.0, 1.0, 1.0],
      BATCH_ID: [0, 1]
    }
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => await parse(arrayBuffer, Tiles3DLoader),
    'throws if the BATCH_ID semantic is defined but BATCHES_LENGTH is not'
  );
  t.end();
});

test('point cloud tile#BATCH_ID semantic uses componentType of UNSIGNED_SHORT by default', t => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJson: {
      POINTS_LENGTH: 2,
      POSITION: [0.0, 0.0, 0.0, 1.0, 1.0, 1.0],
      BATCH_ID: [0, 1],
      BATCH_LENGTH: 2
    }
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  t.throws(
    () => await parse(arrayBuffer, Tiles3DLoader),
    'throws if the BATCH_ID semantic is defined but BATCHES_LENGTH is not'
  );
  // const content = Cesium3DTilesTester.loadTile(scene, arrayBuffer, 'pnts');
  // expect(content._pointCloud._drawCommand._vertexArray._attributes[1].componentDatatype).toEqual(ComponentDatatype.UNSIGNED_SHORT);
  t.end();
});
*/

/*
test('point cloud tile#gets tileset properties', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_RGB_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with rgb colors');

  // const root = tileset.root;
  // const content = root.content;
  // expect(content.tileset).toBe(tileset);
  // expect(content.tile).toBe(root);
  // expect(content.url.indexOf(root._header.content.uri) > -1).toBe(true);

  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with rgb colors', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_RGB_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with rgb colors');
  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with rgba colors', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_RGBA_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with rgba colors');
  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with rgb565 colors', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_RGB565_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with rgb565 colors');
  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with no colors', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_NO_COLOR_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with no colors');
  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with constant colors', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_CONSTANT_COLOR_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with constant colors');
  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with normals', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_NORMALS_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with normals');
  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with oct encoded normals', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_NORMALS_OCT_ENCODED_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with oct encoded normals');
  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with quantized positions', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_QUANTIZED_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with quantized positions');
  t.end();
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with quantized positions and oct-encoded normals', async t => {
  const tileData = await loadRootTileFromTileset(t, POINTCLOUD_QUANTIZED_OCT_ENCODED_URL);
  const tile = await parse(tileData, Tiles3DLoader);
  t.ok(tile, 'loaded point cloud with quantized positions and oct-encoded normals');
  t.end();
});
*/

/*
// TODO - this should be a render test
test('point cloud tile#renders point cloud with draco encoded positions, normals, colors, and batch table properties', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_DRACO_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRender(scene, tileset);
    // Test that Draco-encoded batch table properties are functioning correctly
    tileset.style = new Cesium3DTileStyle({
      color : 'vec4(Number(${secondaryColor}[0] < 1.0), 0.0, 0.0, 1.0)'
    });
    expect(scene).toRenderAndCall(function(rgba) {
      // Produces a red color
      expect(rgba[0]).toBeGreaterThan(rgba[1]);
      expect(rgba[0]).toBeGreaterThan(rgba[2]);
    });
  });
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with draco encoded positions and uncompressed normals and colors', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_DRACO_PARTIAL_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRender(scene, tileset);
  });
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with draco encoded positions, colors, and batch ids', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_DRACO_BATCHED_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRender(scene, tileset);
  });
});

test('point cloud tile#error decoding a draco point cloud causes loading to fail', async t => {
  return pollToPromise(function() {
    return DracoLoader._taskProcessorReady;
  }).then(function() {
    const decoder = DracoLoader._getDecoderTaskProcessor();
    spyOn(decoder, 'scheduleTask').and.returnValue(when.reject({message : 'my error'}));
    return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_DRACO_URL).then(function(tileset) {
      const root = tileset.root;
      return root.contentReadyPromise.then(function() {
        fail('should not resolve');
      }).otherwise(function(error) {
        expect(error.message).toBe('my error');
      });
    });
  });
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud that are not defined relative to center', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_WGS84_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRender(scene, tileset);
  });
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with batch table', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_BATCHED_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRender(scene, tileset);
  });
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with per-point properties', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_WITH_PER_POINT_PROPERTIES_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRender(scene, tileset);
  });
});

// TODO - this should be a render test
test('point cloud tile#renders point cloud with tile transform', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_WITH_TRANSFORM_URL).then(function(tileset) {
    Cesium3DTilesTester.expectRender(scene, tileset);

    const newLongitude = -1.31962;
    const newLatitude = 0.698874;
    const newCenter = Cartesian3.fromRadians(newLongitude, newLatitude, 5.0);
    const newHPR = new HeadingPitchRoll();
    const newTransform = Transforms.headingPitchRollToFixedFrame(newCenter, newHPR);

    // Update tile transform
    tileset.root.transform = newTransform;

    // Move the camera to the new location
    setCamera(newLongitude, newLatitude);
    Cesium3DTilesTester.expectRender(scene, tileset);
  });
});

/*
// TODO - this should be a render test
test('point cloud tile#renders with debug color', async t => {
  CesiumMath.setRandomNumberSeed(0);
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    const color;
    expect(scene).toRenderAndCall(function(rgba) {
      color = rgba;
    });
    tileset.debugColorizeTiles = true;
    expect(scene).notToRender(color);
    tileset.debugColorizeTiles = false;
    expect(scene).toRender(color);
  });
});

// TODO - this should be a render test
test('point cloud tile#renders in CV', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    scene.morphToColumbusView(0.0);
    setCamera(centerLongitude, centerLatitude);
    Cesium3DTilesTester.expectRender(scene, tileset);
  });
});

// TODO - this should be a render test
test('point cloud tile#renders in 2D', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    scene.morphTo2D(0.0);
    setCamera(centerLongitude, centerLatitude);
    tileset.maximumScreenSpaceError = 3;
    Cesium3DTilesTester.expectRender(scene, tileset);
  });
});

test('point cloud tile#picks', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
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

test('point cloud tile#picks based on batchId', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_BATCHED_URL).then(function(tileset) {
    // Get the original color
    const color;
    expect(scene).toRenderAndCall(function(rgba) {
      color = rgba;
    });

    // Change the color of the picked feature to yellow
    expect(scene).toPickAndCall(function(first) {
      expect(first).toBeDefined();

      first.color = Color.clone(Color.YELLOW, first.color);

      // Expect the pixel color to be some shade of yellow
      expect(scene).notToRender(color);

      // Turn show off. Expect a different feature to get picked.
      first.show = false;
      expect(scene).toPickAndCall(function(second) {
        expect(second).toBeDefined();
        expect(second).not.toBe(first);
      });
    });
  });
});

test('point cloud tile#point cloud without batch table works', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    const content = tileset.root.content;
    expect(content.featuresLength).toBe(0);
    expect(content.innerContents).toBeUndefined();
    expect(content.hasProperty(0, 'name')).toBe(false);
    expect(content.getFeature(0)).toBeUndefined();
  });
});

test('point cloud tile#batched point cloud works', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_BATCHED_URL).then(function(tileset) {
    const content = tileset.root.content;
    expect(content.featuresLength).toBe(8);
    expect(content.innerContents).toBeUndefined();
    expect(content.hasProperty(0, 'name')).toBe(true);
    expect(content.getFeature(0)).toBeDefined();
  });
});

test('point cloud tile#point cloud with per-point properties work', async t => {
  // When the batch table contains per-point properties, aka no batching, then a Cesium3DTileBatchTable is not
  // created. There is no per-point show/color/pickId because the overhead is too high. Instead points are styled
  // based on their properties, and these are not accessible from the API.
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_WITH_PER_POINT_PROPERTIES_URL).then(function(tileset) {
    const content = tileset.root.content;
    expect(content.featuresLength).toBe(0);
    expect(content.innerContents).toBeUndefined();
    expect(content.hasProperty(0, 'name')).toBe(false);
    expect(content.getFeature(0)).toBeUndefined();
  });
});

test('point cloud tile#throws when calling getFeature with invalid index', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_BATCHED_URL).then(function(tileset) {
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

test('point cloud tile#Supports back face culling when there are per-point normals', async t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_BATCHED_URL).then(function(tileset) {
    const content = tileset.root.content;

    // Get the number of picked sections with back face culling on
    const pickedCountCulling = 0;
    const pickedCount = 0;
    const picked;

    expect(scene).toPickAndCall(function(result) {
      // Set culling to true
      tileset.pointCloudShading.backFaceCulling = true;

      expect(scene).toPickAndCall(function(result) {
        picked = result;
      });

      while (defined(picked)) {
        picked.show = false;
        expect(scene).toPickAndCall(function(result) { //eslint-disable-line no-loop-func
          picked = result;
        });
        ++pickedCountCulling;
      }

      // Set the shows back to true
      const length = content.featuresLength;
      for (const i = 0; i < length; ++i) {
        const feature = content.getFeature(i);
        feature.show = true;
      }

      // Set culling to false
      tileset.pointCloudShading.backFaceCulling = false;

      expect(scene).toPickAndCall(function(result) {
        picked = result;
      });

      while (defined(picked)) {
        picked.show = false;
        expect(scene).toPickAndCall(function(result) { //eslint-disable-line no-loop-func
          picked = result;
        });
        ++pickedCount;
      }

      expect(pickedCount).toBeGreaterThan(pickedCountCulling);
    });
  });
});

const noAttenuationPixelCount;
function attenuationTest(postLoadCallback) {
  const scene = createScene({
    canvas : createCanvas(10, 10)
  });
  noAttenuationPixelCount = scene.logarithmicDepthBuffer ? 20 : 16;
  const center = new Cartesian3.fromRadians(centerLongitude, centerLatitude, 5.0);
  scene.camera.lookAt(center, new HeadingPitchRange(0.0, -1.57, 5.0));
  scene.postProcessStages.fxaa.enabled = false;
  scene.camera.zoomIn(6);

  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_NO_COLOR_URL).then(function(tileset) {
    tileset.pointCloudShading.eyeDomeLighting = false;
    tileset.root.refine = Cesium3DTileRefine.REPLACE;
    postLoadCallback(scene, tileset);
    scene.destroyForSpecs();
  });
}

test('point cloud tile#attenuates points based on geometric error', t => {
  return attenuationTest(function(scene, tileset) {
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.geometricErrorScale = 1.0;
    tileset.pointCloudShading.maximumAttenuation = undefined;
    tileset.pointCloudShading.baseResolution = undefined;
    tileset.maximumScreenSpaceError = 16;
    expect(scene).toRenderPixelCountAndCall(function(pixelCount) {
      expect(pixelCount).toBeGreaterThan(noAttenuationPixelCount);
    });
  });
});

test('point cloud tile#modulates attenuation using the tileset screen space error', t => {
  return attenuationTest(function(scene, tileset) {
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.geometricErrorScale = 1.0;
    tileset.pointCloudShading.maximumAttenuation = undefined;
    tileset.pointCloudShading.baseResolution = undefined;
    tileset.maximumScreenSpaceError = 1;
    expect(scene).toRenderPixelCountAndCall(function(pixelCount) {
      expect(pixelCount).toEqual(noAttenuationPixelCount);
    });
  });
});

test('point cloud tile#modulates attenuation using the maximumAttenuation parameter', t => {
  return attenuationTest(function(scene, tileset) {
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.geometricErrorScale = 1.0;
    tileset.pointCloudShading.maximumAttenuation = 1;
    tileset.pointCloudShading.baseResolution = undefined;
    tileset.maximumScreenSpaceError = 16;
    expect(scene).toRenderPixelCountAndCall(function(pixelCount) {
      expect(pixelCount).toEqual(noAttenuationPixelCount);
    });
  });
});

test('point cloud tile#modulates attenuation using the baseResolution parameter', t => {
  return attenuationTest(function(scene, tileset) {
    // POINTCLOUD_NO_COLOR_URL is a single tile with GeometricError = 0,
    // which results in default baseResolution being computed
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.geometricErrorScale = 1.0;
    tileset.pointCloudShading.maximumAttenuation = undefined;
    tileset.pointCloudShading.baseResolution = 0.20;
    tileset.maximumScreenSpaceError = 16;
    expect(scene).toRenderPixelCountAndCall(function(pixelCount) {
      expect(pixelCount).toEqual(noAttenuationPixelCount);
    });
  });
});

test('point cloud tile#modulates attenuation using the geometricErrorScale parameter', t => {
  return attenuationTest(function(scene, tileset) {
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.geometricErrorScale = 0.2;
    tileset.pointCloudShading.maximumAttenuation = undefined;
    tileset.pointCloudShading.baseResolution = 1.0;
    tileset.maximumScreenSpaceError = 1;
    expect(scene).toRenderPixelCountAndCall(function(pixelCount) {
      expect(pixelCount).toEqual(noAttenuationPixelCount);
    });
  });
});

test('point cloud tile#attenuates points based on geometric error in 2D', t => {
  return attenuationTest(function(scene, tileset) {
    scene.morphTo2D(0);
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.geometricErrorScale = 1.0;
    tileset.pointCloudShading.maximumAttenuation = undefined;
    tileset.pointCloudShading.baseResolution = undefined;
    tileset.maximumScreenSpaceError = 16;
    expect(scene).toRenderPixelCountAndCall(function(pixelCount) {
      expect(pixelCount).toBeGreaterThan(noAttenuationPixelCount);
    });
  });
});

test('point cloud tile#applies shader style', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_WITH_PER_POINT_PROPERTIES_URL).then(function(tileset) {
    const content = tileset.root.content;

    // Solid red color
    tileset.style = new Cesium3DTileStyle({
      color : 'color("red")'
    });
    expect(scene).toRender([255, 0, 0, 255]);
    expect(content._pointCloud._styleTranslucent).toBe(false);

    // Applies translucency
    tileset.style = new Cesium3DTileStyle({
      color : 'rgba(255, 0, 0, 0.005)'
    });
    expect(scene).toRenderAndCall(function(rgba) {
      // Pixel is a darker red
      expect(rgba[0]).toBeLessThan(255);
      expect(rgba[1]).toBe(0);
      expect(rgba[2]).toBe(0);
      expect(rgba[3]).toBe(255);
      expect(content._pointCloud._styleTranslucent).toBe(true);
    });

    // Style with property
    tileset.style = new Cesium3DTileStyle({
      color : 'color() * ${temperature}'
    });
    expect(scene).toRenderAndCall(function(rgba) {
      // Pixel color is some shade of gray
      expect(rgba[0]).toBe(rgba[1]);
      expect(rgba[0]).toBe(rgba[2]);
      expect(rgba[0]).toBeGreaterThan(0);
      expect(rgba[0]).toBeLessThan(255);
    });

    // When no conditions are met the default color is white
    tileset.style = new Cesium3DTileStyle({
      color : {
        conditions : [
          ['${secondaryColor}[0] > 1.0', 'color("red")'] // This condition will not be met
        ]
      }
    });
    expect(scene).toRender([255, 255, 255, 255]);

    // Apply style with conditions
    tileset.style = new Cesium3DTileStyle({
      color : {
        conditions : [
          ['${temperature} < 0.1', 'color("#000099")'],
          ['${temperature} < 0.2', 'color("#00cc99", 1.0)'],
          ['${temperature} < 0.3', 'color("#66ff33", 0.5)'],
          ['${temperature} < 0.4', 'rgba(255, 255, 0, 0.1)'],
          ['${temperature} < 0.5', 'rgb(255, 128, 0)'],
          ['${temperature} < 0.6', 'color("red")'],
          ['${temperature} < 0.7', 'color("rgb(255, 102, 102)")'],
          ['${temperature} < 0.8', 'hsl(0.875, 1.0, 0.6)'],
          ['${temperature} < 0.9', 'hsla(0.83, 1.0, 0.5, 0.1)'],
          ['true', 'color("#FFFFFF", 1.0)']
        ]
      }
    });
    expect(scene).notToRender([0, 0, 0, 255]);

    // Apply show style
    tileset.style = new Cesium3DTileStyle({
      show : true
    });
    expect(scene).notToRender([0, 0, 0, 255]);

    // Apply show style that hides all points
    tileset.style = new Cesium3DTileStyle({
      show : false
    });
    expect(scene).toRender([0, 0, 0, 255]);

    // Apply show style with property
    tileset.style = new Cesium3DTileStyle({
      show : '${temperature} > 0.1'
    });
    expect(scene).notToRender([0, 0, 0, 255]);
    tileset.style = new Cesium3DTileStyle({
      show : '${temperature} > 1.0'
    });
    expect(scene).toRender([0, 0, 0, 255]);

    // Apply style with point cloud semantics
    tileset.style = new Cesium3DTileStyle({
      color : '${COLOR} / 2.0',
      show : '${POSITION}[0] > 0.5'
    });
    expect(scene).notToRender([0, 0, 0, 255]);

    // Apply pointSize style
    tileset.style = new Cesium3DTileStyle({
      pointSize : 5.0
    });
    expect(scene).notToRender([0, 0, 0, 255]);
  });
});

test('point cloud tile#rebuilds shader style when expression changes', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_TILESET_URL).then(function(tileset) {
    // Solid red color
    tileset.style = new Cesium3DTileStyle({
      color : 'color("red")'
    });
    expect(scene).toRender([255, 0, 0, 255]);

    tileset.style.color = new Expression('color("lime")');
    tileset.makeStyleDirty();
    expect(scene).toRender([0, 255, 0, 255]);

    tileset.style.color = new Expression('color("blue", 0.5)');
    tileset.makeStyleDirty();
    expect(scene).toRenderAndCall(function(rgba) {
      expect(rgba).toEqualEpsilon([0, 0, 255, 255], 5);
    });

    const i;
    const commands = scene.frameState.commandList;
    const commandsLength = commands.length;
    expect(commandsLength).toBeGreaterThan(1); // Just check that at least some children are rendered
    for (i = 0; i < commandsLength; ++i) {
      expect(commands[i].pass).toBe(Pass.TRANSLUCENT);
    }

    tileset.style.color = new Expression('color("yellow")');
    tileset.makeStyleDirty();
    expect(scene).toRender([255, 255, 0, 255]);

    commands = scene.frameState.commandList;
    commandsLength = commands.length;
    for (i = 0; i < commandsLength; ++i) {
      expect(commands[i].pass).not.toBe(Pass.TRANSLUCENT);
    }
  });
});

test('point cloud tile#applies shader style to point cloud with normals', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_QUANTIZED_OCT_ENCODED_URL).then(function(tileset) {
    tileset.style = new Cesium3DTileStyle({
      color : 'color("red")'
    });
    expect(scene).toRenderAndCall(function(rgba) {
      expect(rgba[0]).toBeGreaterThan(0);
      expect(rgba[0]).toBeLessThan(255);
    });
  });
});

test('point cloud tile#applies shader style to point cloud with normals', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_QUANTIZED_OCT_ENCODED_URL).then(function(tileset) {
    tileset.style = new Cesium3DTileStyle({
      color : 'color("red")'
    });
    expect(scene).toRenderAndCall(function(rgba) {
      expect(rgba[0]).toBeGreaterThan(0);
    });
  });
});

test('point cloud tile#applies shader style to point cloud without colors', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_NO_COLOR_URL).then(function(tileset) {
    tileset.style = new Cesium3DTileStyle({
      color : 'color("red")'
    });
    expect(scene).toRender([255, 0, 0, 255]);
  });
});

test('point cloud tile#throws if style references the NORMAL semantic but the point cloud does not have per-point normals', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    tileset.style = new Cesium3DTileStyle({
      color : '${NORMAL}[0] > 0.5'
    });
    expect(function() {
      scene.renderForSpecs();
    }).toThrowRuntimeError();
  });
});

test('point cloud tile#throws when shader style reference a non-existent property', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_WITH_PER_POINT_PROPERTIES_URL).then(function(tileset) {
    tileset.style = new Cesium3DTileStyle({
      color : 'color() * ${non_existent_property}'
    });
    expect(function() {
      scene.renderForSpecs();
    }).toThrowRuntimeError();
  });
});

test('point cloud tile#does not apply shader style if the point cloud has a batch table', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_BATCHED_URL).then(function(tileset) {
    const content = tileset.root.content;
    const shaderProgram = content._pointCloud._drawCommand.shaderProgram;
    tileset.style = new Cesium3DTileStyle({
      color:'color("red")'
    });
    scene.renderForSpecs();
    expect(content._pointCloud._drawCommand.shaderProgram).toBe(shaderProgram);

    // Point cloud is styled through the batch table
    expect(scene).notToRender([0, 0, 0, 255]);
  });
});

test('point cloud tile#throws when shader style is invalid', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    tileset.style = new Cesium3DTileStyle({
      show : '1 < "2"'
    });
    expect(function() {
      scene.renderForSpecs();
    }).toThrowRuntimeError();
  });
});

test('point cloud tile#gets memory usage', t => {
  const promises = [
    Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_NO_COLOR_URL),
    Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL),
    Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_NORMALS_URL),
    Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_QUANTIZED_OCT_ENCODED_URL)
  ];

  // 1000 points
  const expectedGeometryMemory = [
    1000 * 12, // 3 floats (xyz)
    1000 * 15, // 3 floats (xyz), 3 bytes (rgb)
    1000 * 27, // 3 floats (xyz), 3 bytes (rgb), 3 floats (normal)
    1000 * 11  // 3 shorts (quantized xyz), 3 bytes (rgb), 2 bytes (oct-encoded normal)
  ];

  return when.all(promises).then(function(tilesets) {
    const length = tilesets.length;
    for (const i = 0; i < length; ++i) {
      const content = tilesets[i].root.content;
      expect(content.geometryByteLength).toEqual(expectedGeometryMemory[i]);
      expect(content.texturesByteLength).toEqual(0);
    }
  });
});

test('point cloud tile#gets memory usage for batch point cloud', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_BATCHED_URL).then(function(tileset) {
    const content = tileset.root.content;

    // Point cloud consists of positions, colors, normals, and batchIds
    // 3 floats (xyz), 3 floats (normal), 1 byte (batchId)
    const pointCloudGeometryMemory = 1000 * 25;

    // One RGBA byte pixel per feature
    const batchTexturesByteLength = content.featuresLength * 4;
    const pickTexturesByteLength = content.featuresLength * 4;

    // Features have not been picked or colored yet, so the batch table contribution is 0.
    expect(content.geometryByteLength).toEqual(pointCloudGeometryMemory);
    expect(content.texturesByteLength).toEqual(0);
    expect(content.batchTableByteLength).toEqual(0);

    // Color a feature and expect the texture memory to increase
    content.getFeature(0).color = Color.RED;
    scene.renderForSpecs();
    expect(content.geometryByteLength).toEqual(pointCloudGeometryMemory);
    expect(content.texturesByteLength).toEqual(0);
    expect(content.batchTableByteLength).toEqual(batchTexturesByteLength);

    // Pick the tile and expect the texture memory to increase
    scene.pickForSpecs();
    expect(content.geometryByteLength).toEqual(pointCloudGeometryMemory);
    expect(content.texturesByteLength).toEqual(0);
    expect(content.batchTableByteLength).toEqual(batchTexturesByteLength + pickTexturesByteLength);
  });
});

test('point cloud tile#rebuilds shaders when clipping planes are enabled, change between union and intersection, or change count', t =>) {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    const tile = tileset.root;
    tile._isClipped = true;
    const content = tile.content;

    const noClipFS = content._pointCloud._drawCommand.shaderProgram._fragmentShaderText;
    expect(noClipFS.indexOf('clip') !== -1).toBe(false);

    const clippingPlanes = new ClippingPlaneCollection({
      planes : [
        new ClippingPlane(Cartesian3.UNIT_X, 0.0)
      ],
      unionClippingRegions : false
    });
    tileset.clippingPlanes = clippingPlanes;

    clippingPlanes.update(scene.frameState);
    tile.update(tileset, scene.frameState);
    const clipOneIntersectFS = content._pointCloud._drawCommand.shaderProgram._fragmentShaderText;
    expect(clipOneIntersectFS.indexOf('= clip(') !== -1).toBe(true);
    expect(clipOneIntersectFS.indexOf('float clip') !== -1).toBe(true);

    clippingPlanes.unionClippingRegions = true;

    clippingPlanes.update(scene.frameState);
    tile.update(tileset, scene.frameState);
    const clipOneUnionFS = content._pointCloud._drawCommand.shaderProgram._fragmentShaderText;
    expect(clipOneUnionFS.indexOf('= clip(') !== -1).toBe(true);
    expect(clipOneUnionFS.indexOf('float clip') !== -1).toBe(true);
    expect(clipOneUnionFS).not.toEqual(clipOneIntersectFS);

    clippingPlanes.add(new ClippingPlane(Cartesian3.UNIT_Y, 1.0));

    clippingPlanes.update(scene.frameState);
    tile.update(tileset, scene.frameState);
    const clipTwoUnionFS = content._pointCloud._drawCommand.shaderProgram._fragmentShaderText;
    expect(clipTwoUnionFS.indexOf('= clip(') !== -1).toBe(true);
    expect(clipTwoUnionFS.indexOf('float clip') !== -1).toBe(true);
    expect(clipTwoUnionFS).not.toEqual(clipOneIntersectFS);
    expect(clipTwoUnionFS).not.toEqual(clipOneUnionFS);
  });
});

test('point cloud tile#clipping planes selectively disable rendering', t =>) {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    const color;
    expect(scene).toRenderAndCall(function(rgba) {
      color = rgba;
    });

    const clipPlane = new ClippingPlane(Cartesian3.UNIT_Z, -10.0);
    tileset.clippingPlanes = new ClippingPlaneCollection({
      planes : [
        clipPlane
      ]
    });

    expect(scene).notToRender(color);

    clipPlane.distance = 0.0;

    expect(scene).toRender(color);
  });
});

test('point cloud tile#clipping planes apply edge styling', t => {
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    const color;
    expect(scene).toRenderAndCall(function(rgba) {
      color = rgba;
    });

    const clipPlane = new ClippingPlane(Cartesian3.UNIT_Z, -10.0);
    tileset.clippingPlanes = new ClippingPlaneCollection ({
      planes : [
        clipPlane
      ],
      modelMatrix : Transforms.eastNorthUpToFixedFrame(tileset.boundingSphere.center),
      edgeWidth : 20.0,
      edgeColor : Color.RED
    });

    expect(scene).notToRender(color);
  });
});

test('point cloud tile#clipping planes union regions (Uint8)', t => {
  // Force uint8 mode - there's a slight rendering difference between
  // float and packed uint8 clipping planes for this test due to the small context
  spyOn(ClippingPlaneCollection, 'useFloatTexture').and.returnValue(false);
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    const color;
    expect(scene).toRenderAndCall(function(rgba) {
      color = rgba;
    });

    tileset.clippingPlanes = new ClippingPlaneCollection ({
      planes : [
        new ClippingPlane(Cartesian3.UNIT_Z, 0.0),
        new ClippingPlane(Cartesian3.UNIT_X, 0.0)
      ],
      modelMatrix : Transforms.eastNorthUpToFixedFrame(tileset.boundingSphere.center),
      unionClippingRegions: true
    });

    expect(scene).notToRender(color);

    tileset.clippingPlanes.unionClippingRegions = false;

    expect(scene).toRender(color);
  });
});

test('point cloud tile#clipping planes union regions (Float)', t => {
  if (!ClippingPlaneCollection.useFloatTexture(scene.context)) {
    // This configuration for the test fails in uint8 mode due to the small context
    return;
  }
  return Cesium3DTilesTester.loadTileset(scene, POINTCLOUD_RGB_URL).then(function(tileset) {
    const color;
    expect(scene).toRenderAndCall(function(rgba) {
      color = rgba;
    });

    tileset.clippingPlanes = new ClippingPlaneCollection ({
      planes : [
        new ClippingPlane(Cartesian3.UNIT_Z, -10.0),
        new ClippingPlane(Cartesian3.UNIT_X, 0.0)
      ],
      modelMatrix : Transforms.eastNorthUpToFixedFrame(tileset.boundingSphere.center),
      unionClippingRegions: true
    });

    expect(scene).notToRender(color);

    tileset.clippingPlanes.unionClippingRegions = false;

    expect(scene).toRender(color);
  });
});

test('point cloud tile#destroys', t => {
  return Cesium3DTilesTester.tileDestroys(scene, POINTCLOUD_RGB_URL);
});
*/
