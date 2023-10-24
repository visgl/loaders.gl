import test from 'tape-promise/tape';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {load, setLoaderOptions, isBrowser} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/worker-utils';
import convertB3dmToI3sGeometry, {
  getPropertyTable
} from '../../../src/i3s-converter/helpers/geometry-converter';
import {PGMLoader} from '../../../src/pgm-loader';
import {getAttributeTypesMapFromPropertyTable} from '../../../src/i3s-converter/helpers/feature-attributes';
import {AttributeMetadataInfo} from '../../../src/i3s-converter/helpers/attribute-metadata-info';

import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {Matrix4} from '@math.gl/core';

const PGM_FILE_PATH = '@loaders.gl/tile-converter/test/data/egm84-30.pgm';
const FRANKFURT_B3DM_FILE_PATH =
  '@loaders.gl/tile-converter/test/data/Frankfurt/L5/OF/474_5548_-1_lv5_group_0.osgb_3.b3dm';
const BERLIN_B3DM_FILE_PATH =
  '@loaders.gl/tile-converter/test/data/Berlin/1511577738.buildings.b3dm';
const NEW_YORK_B3DM_FILE_PATH = '@loaders.gl/tile-converter/test/data/NewYork/75343/6/5/1.b3dm';
const FERRY_GLTF_FILE_PATH = '@loaders.gl/tile-converter/test/data/Ferry/754834/6/0000000.glb';
const MUSCATATUCK_GLB_FILE_PATH = '@loaders.gl/tile-converter/test/data/Muscatatuck/0/0/0.glb';
const TRIANGLE_STRIP_B3DM_FILE_PATH =
  '@loaders.gl/tile-converter/test/data/TriangleStrip/lod1_0.b3dm';
const HELSINKI_GLB_FILE_PATH =
  '@loaders.gl/tile-converter/test/data/helsinki-glb-8-meshopt/0/0.glb';
const BASEGLOBE_GLB_FILE_PATH = '@loaders.gl/tile-converter/test/data/baseglobe/0/0/0/0.glb';

setLoaderOptions({
  _worker: 'test'
});

test('tile-converter(i3s)#convert B3dmToI3sGeometry - should convert Frankfurt tile content', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  async function testTileContent(draco, generateBoundingVolumes) {
    let nodeId = 1;
    const addNodeToNodePage = async () => nodeId++;
    const featuresHashArray = [];
    const tileContent = await load(FRANKFURT_B3DM_FILE_PATH, Tiles3DLoader);
    const propertyTable = getPropertyTable(tileContent);
    const tileTransform = new Matrix4([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4055182.44018, 615965.038498, 4867494.346586, 1
    ]);
    const tileBoundingVolume = new BoundingSphere([
      4051833.805439, 618316.801881, 4870677.172590001
    ]);
    const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
    const attributeStorageInfo = [];
    const shouldMergeMaterials = false;
    try {
      const convertedResources = await convertB3dmToI3sGeometry(
        tileContent,
        tileTransform,
        tileBoundingVolume,
        addNodeToNodePage,
        propertyTable,
        featuresHashArray,
        attributeStorageInfo,
        draco,
        generateBoundingVolumes,
        shouldMergeMaterials,
        geoidHeightModel,
        {}
      );
      t.ok(convertedResources);
      if (!convertedResources) {
        return;
      }
      t.equals(convertedResources.length, 1, 'Returns 1 node');
      const nodeResources = convertedResources[0];
      await checkNodeResources(
        nodeResources,
        {
          draco,
          vertexCount: 148281,
          attributesLength: 0,
          featureCount: 1,
          nonCompressedGeometryByteLength: 5338140,
          compressedGeometryByteLength: 2016506,
          texture: {
            mimeType: 'image/jpeg',
            width: 2048,
            height: 1024,
            bitmapByteLength: 8388608
          },
          boundingVolumes: generateBoundingVolumes
            ? {
                mbs: [8.622161535185821, 50.0841151227351, -188.79808730024337, 633.1951829721843],
                obb: {
                  center: [8.622050871641566, 50.084076204176576, -194.3917133680221],
                  halfSize: [611.3686583875675, 484.1319449471776, 365.7073438855587],
                  quaternion: [
                    0.478909280552476, -0.3432001871992151, 0.5224020278817846, 0.6164054297068876
                  ]
                }
              }
            : false
        },
        t
      );
    } finally {
      // Clean up worker pools
      const workerFarm = WorkerFarm.getWorkerFarm({});
      workerFarm.destroy();
    }
  }

  await testTileContent(true, false);
  await testTileContent(false, false);
  await testTileContent(true, true);

  t.end();
});

test('tile-converter(i3s)#convertB3dmToI3sGeometry - should convert Berlin tile content', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  let nodeId = 1;
  const addNodeToNodePage = async () => nodeId++;
  const featuresHashArray = [];
  const draco = true;
  const generageBoundingVolumes = false;
  const shouldMergeMaterials = false;
  const tileContent = await load(BERLIN_B3DM_FILE_PATH, Tiles3DLoader);
  const propertyTable = getPropertyTable(tileContent);
  const tileTransform = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  const tileBoundingVolume = new BoundingSphere([
    3781178.760596639, 902182.0936989671, 5039803.738586299
  ]);
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  const attributeStorageInfo = [];
  try {
    const convertedResources = await convertB3dmToI3sGeometry(
      tileContent,
      tileTransform,
      tileBoundingVolume,
      addNodeToNodePage,
      propertyTable,
      featuresHashArray,
      attributeStorageInfo,
      draco,
      generageBoundingVolumes,
      shouldMergeMaterials,
      geoidHeightModel,
      {}
    );
    t.ok(convertedResources);
    if (!convertedResources) {
      return;
    }
    t.equals(convertedResources.length, 40, 'Returns 40 nodes');
    await checkNodeResources(
      convertedResources[0],
      {
        draco,
        vertexCount: 14025,
        attributesLength: 0,
        featureCount: 1,
        nonCompressedGeometryByteLength: 392724,
        compressedGeometryByteLength: 208506
      },
      t
    );
    await checkNodeResources(
      convertedResources[1],
      {
        draco,
        vertexCount: 69,
        attributesLength: 0,
        featureCount: 1,
        nonCompressedGeometryByteLength: 2508,
        compressedGeometryByteLength: 1673,
        texture: {
          mimeType: 'image/png',
          width: 64,
          height: 64,
          bitmapByteLength: 16384
        }
      },
      t
    );
  } finally {
    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('tile-converter(i3s)#convertB3dmToI3sGeometry - should convert New York tile content', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  let nodeId = 1;
  const addNodeToNodePage = async () => nodeId++;
  const featuresHashArray = [];
  const draco = true;
  const generageBoundingVolumes = false;
  const shouldMergeMaterials = false;
  const tileContent = await load(NEW_YORK_B3DM_FILE_PATH, Tiles3DLoader);
  const propertyTable = getPropertyTable(tileContent);
  const tileTransform = new Matrix4([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4055182.44018, 615965.038498, 4867494.346586, 1
  ]);
  const tileBoundingVolume = new BoundingSphere([
    1319833.032477655, -4673588.626640962, 4120866.796624521
  ]);
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  const attributeStorageInfo = getAttributeStorageInfo(propertyTable);
  try {
    const convertedResources = await convertB3dmToI3sGeometry(
      tileContent,
      tileTransform,
      tileBoundingVolume,
      addNodeToNodePage,
      propertyTable,
      featuresHashArray,
      attributeStorageInfo,
      draco,
      generageBoundingVolumes,
      shouldMergeMaterials,
      geoidHeightModel,
      {}
    );
    t.ok(convertedResources);
    if (!convertedResources) {
      return;
    }
    t.equals(convertedResources.length, 1, 'Returns 1 node');
    const nodeResources = convertedResources[0];
    await checkNodeResources(
      nodeResources,
      {
        draco,
        vertexCount: 50286,
        attributesLength: 10,
        featureCount: 275,
        nonCompressedGeometryByteLength: 1412416,
        compressedGeometryByteLength: 608764
      },
      t
    );
  } finally {
    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('tile-converter(i3s)#convertB3dmToI3sGeometry - should convert Ferry tile content', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  let nodeId = 1;
  const addNodeToNodePage = async () => nodeId++;
  const featuresHashArray = [];
  const draco = true;
  const generageBoundingVolumes = false;
  const shouldMergeMaterials = false;
  const tileContent = await load(FERRY_GLTF_FILE_PATH, Tiles3DLoader);
  const propertyTable = getPropertyTable(tileContent);
  const tileTransform = new Matrix4([
    0.8443837640659682, -0.5357387973460459, 0, 0, 0.32832660036003297, 0.5174791372742712,
    0.7902005985709575, 0, -0.42334111834053034, -0.667232555788526, 0.6128482797708588, 0,
    -2703514.4440963655, -4261038.614006309, 3887533.151398322, 1
  ]);
  const tileBoundingVolume = new BoundingSphere([
    -2703528.7614193764, -4261014.993900511, 3887572.9889940596
  ]);
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  const attributeStorageInfo = getAttributeStorageInfo(propertyTable);
  try {
    const convertedResources = await convertB3dmToI3sGeometry(
      tileContent,
      tileTransform,
      tileBoundingVolume,
      addNodeToNodePage,
      propertyTable,
      featuresHashArray,
      attributeStorageInfo,
      draco,
      generageBoundingVolumes,
      shouldMergeMaterials,
      geoidHeightModel,
      {}
    );
    t.ok(convertedResources);
    if (!convertedResources) {
      return;
    }
    t.equals(convertedResources.length, 1, 'Returns 1 node');
    const nodeResources = convertedResources[0];
    await checkNodeResources(
      nodeResources,
      {
        draco,
        vertexCount: 36858,
        attributesLength: 3,
        featureCount: 3,
        nonCompressedGeometryByteLength: 1326944,
        compressedGeometryByteLength: 1236750,
        texture: {
          mimeType: 'image/jpeg',
          width: 355,
          height: 356,
          bitmapByteLength: 505520
        }
      },
      t
    );
  } finally {
    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('tile-converter(i3s)#convertB3dmToI3sGeometry - TRIANGLE_STRIPS should be converted to independent TRIANGLES', async (t) => {
  const EXPECT_VERTEX_COUNT = [42891, 12861];

  if (isBrowser) {
    t.end();
    return;
  }

  let nodeId = 1;
  const addNodeToNodePage = async () => nodeId++;
  const featuresHashArray = [];
  const draco = true;
  const generageBoundingVolumes = false;
  const shouldMergeMaterials = false;
  const tileContent = await load(TRIANGLE_STRIP_B3DM_FILE_PATH, Tiles3DLoader);
  const propertyTable = getPropertyTable(tileContent);
  const tileTransform = new Matrix4([
    -0.16491735, -0.98630739, 0, 0, -0.70808611, 0.11839684, 0.69612948, 0, -0.68659765, 0.11480383,
    -0.71791625, 0, -4386786.82071079, 733504.6938935, -4556188.9172627, 1
  ]);
  const tileBoundingVolume = new BoundingSphere([
    -4386794.587985844, 733486.8163247632, -4556196.147240348
  ]);
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  const attributeStorageInfo = getAttributeStorageInfo(propertyTable);
  try {
    const convertedResources = await convertB3dmToI3sGeometry(
      tileContent,
      tileTransform,
      tileBoundingVolume,
      addNodeToNodePage,
      propertyTable,
      featuresHashArray,
      attributeStorageInfo,
      draco,
      generageBoundingVolumes,
      shouldMergeMaterials,
      geoidHeightModel,
      {}
    );
    t.ok(convertedResources);
    if (!convertedResources) {
      return;
    }
    t.equals(convertedResources.length, 2, 'Returns 2 nodes');
    for (let i = 0; i < convertedResources.length; i++) {
      const nodeResources = convertedResources[i];
      t.equals(nodeResources.vertexCount, EXPECT_VERTEX_COUNT[i]);
    }
  } finally {
    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('tile-converter(i3s)#convertB3dmToI3sGeometry - should not convert point geometry', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  let nodeId = 1;
  const addNodeToNodePage = async () => nodeId++;
  const featuresHashArray = [];
  const draco = true;
  const generageBoundingVolumes = false;
  const shouldMergeMaterials = false;
  const tileContent = await load(HELSINKI_GLB_FILE_PATH, Tiles3DLoader);
  const propertyTable = getPropertyTable(tileContent);
  const tileTransform = new Matrix4([
    -0.4222848483394723, 0.9064631856081685, 0, 0, -0.786494516061795, -0.3663962560290312,
    0.49717216311116175, 0, 0.4506682627694476, 0.2099482714980043, 0.8676519119020993, 0,
    2881693.941235528, 1342465.6491912308, 5510858.997465198, 1
  ]);
  const tileBoundingVolume = new BoundingSphere([
    2881727.346362028, 1342482.044833547, 5510923.203394569
  ]);
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  const attributeStorageInfo = getAttributeStorageInfo(propertyTable);
  try {
    await convertB3dmToI3sGeometry(
      tileContent,
      tileTransform,
      tileBoundingVolume,
      addNodeToNodePage,
      propertyTable,
      featuresHashArray,
      attributeStorageInfo,
      draco,
      generageBoundingVolumes,
      shouldMergeMaterials,
      geoidHeightModel,
      {}
    );
    t.fail('The conversion should fail');
  } catch (e) {
    // @ts-ignore 'e' is of type 'unknown'
    t.equal(e.message, 'Primitive - unsupported mode 0');
  } finally {
    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('tile-converter(i3s)#getPropertyTable - should get the property table from EXT_feature_metadata extension', async (t) => {
  const propertyTableExpected = {
    'r3dm::uncertainty_ce90sum': [33, 35, 29, 32, 24, 28, 25, 39, 30, 34, 27, 36, 31, 37, 23]
  };

  if (isBrowser) {
    t.end();
    return;
  }
  const tileContent = await load(MUSCATATUCK_GLB_FILE_PATH, Tiles3DLoader);
  const propertyTable = getPropertyTable(tileContent, 'r3dm::uncertainty_ce90sum');
  t.deepEquals(propertyTable, propertyTableExpected, 'Returns property table');

  // Clean up worker pools
  const workerFarm = WorkerFarm.getWorkerFarm({});
  workerFarm.destroy();

  t.end();
});

test('tile-converter(i3s)#convertB3dmToI3sGeometry - should convert tile content with EXT_feature_metadata extension', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }
  let nodeId = 1;
  const addNodeToNodePage = async () => nodeId++;
  const featuresHashArray = [];
  const draco = true;
  const generageBoundingVolumes = false;
  const shouldMergeMaterials = false;
  const tileContent = await load(MUSCATATUCK_GLB_FILE_PATH, Tiles3DLoader);
  const propertyTable = getPropertyTable(tileContent, 'r3dm::uncertainty_ce90sum');
  const tileTransform = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  const tileBoundingVolume = new BoundingSphere([386500, -4945000, 3997000]);
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  const attributeStorageInfo = getAttributeStorageInfo(propertyTable);
  try {
    const convertedResources = await convertB3dmToI3sGeometry(
      tileContent,
      tileTransform,
      tileBoundingVolume,
      addNodeToNodePage,
      propertyTable,
      featuresHashArray,
      attributeStorageInfo,
      draco,
      generageBoundingVolumes,
      shouldMergeMaterials,
      geoidHeightModel,
      {},
      'r3dm::uncertainty_ce90sum'
    );
    t.ok(convertedResources);
    if (!convertedResources) {
      return;
    }
    t.equals(convertedResources.length, 1, 'Returns 1 node');
    const nodeResources = convertedResources[0];
    await checkNodeResources(
      nodeResources,
      {
        draco,
        vertexCount: 309,
        attributesLength: 2,
        featureCount: 12,
        nonCompressedGeometryByteLength: 11324,
        compressedGeometryByteLength: 5700,
        texture: {
          mimeType: 'image/jpeg',
          width: 512,
          height: 512,
          bitmapByteLength: 1048576
        }
      },
      t
    );
  } finally {
    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('tile-converter(i3s)#convertB3dmToI3sGeometry - array of UINTxx should be converted to a node attibute of type string', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  /*
  This is "color" attributes that is actually an array[8] of arrays[3] of UINT8:
  255,0,0
  255,255,0
  255,125,0
  0,255,0
  0,255,125
  63,255,0
  63,170,0
  0,0,255
  It should be converted to the following attributes buffer:
  */
  const expectedArray = new Uint8Array([
    8, 0, 0, 0, 72, 0, 0, 0, 8, 0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 8, 0, 0, 0, 10, 0, 0, 0, 9, 0, 0,
    0, 9, 0, 0, 0, 8, 0, 0, 0, 50, 53, 53, 44, 48, 44, 48, 0, 50, 53, 53, 44, 50, 53, 53, 44, 48, 0,
    50, 53, 53, 44, 49, 50, 53, 44, 48, 0, 48, 44, 50, 53, 53, 44, 48, 0, 48, 44, 50, 53, 53, 44,
    49, 50, 53, 0, 54, 51, 44, 50, 53, 53, 44, 48, 0, 54, 51, 44, 49, 55, 48, 44, 48, 0, 48, 44, 48,
    44, 50, 53, 53, 0
  ]);

  let nodeId = 1;
  const addNodeToNodePage = async () => nodeId++;
  const featuresHashArray = [];
  const draco = true;
  const generageBoundingVolumes = false;
  const shouldMergeMaterials = false;
  const tileContent = await load(BASEGLOBE_GLB_FILE_PATH, Tiles3DLoader);
  const metadataClass = 'owt_lulc';
  const propertyTable = getPropertyTable(tileContent, metadataClass);
  const tileTransform = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  const center = [3189000, 0, -433.4];
  const halfAxes = [
    1673260.3982534984, 0, 1521488.2883266362, 0, 45, 0, -1595354.0829185273, 0, 1595787.497284685
  ];
  const tileBoundingVolume = new OrientedBoundingBox(center, halfAxes);
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  const attributeStorageInfo = getAttributeStorageInfo(propertyTable);
  try {
    const convertedResources = await convertB3dmToI3sGeometry(
      tileContent,
      tileTransform,
      tileBoundingVolume,
      addNodeToNodePage,
      propertyTable,
      featuresHashArray,
      attributeStorageInfo,
      draco,
      generageBoundingVolumes,
      shouldMergeMaterials,
      geoidHeightModel,
      {},
      metadataClass
    );
    const attributes = convertedResources?.[0].attributes?.[1];
    t.deepEquals(new Uint8Array(attributes || []), expectedArray, 'Array represents ');
  } finally {
    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('tile-converter(i3s)#convertB3dmToI3sGeometry - should convert 64-bit attributes to strings', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  const propertyTable = {
    color: [11n, 22n, 33n, 44n, 55n, 66n, 77n, 88n, 99n, 111n, 222n, 333n],
    component: [
      'Windows',
      'Frames',
      'Wall',
      'Roof',
      'Skylight',
      'Air conditioner (white box)',
      'Air conditioner (black box)',
      'Air conditioner (tall black/white box)',
      'Clock',
      'Pillars',
      'Street Light',
      'Traffic Light'
    ]
  };
  /*
    'color' 64-bit values from propertyTable should be converted to strings hat are in attributeBufferExpected.
  */
  const attributeBufferExpected = [
    3, 0, 0, 0, 12, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 51, 51, 0, 50, 50, 50, 0, 110, 117,
    108, 108, 0
  ];

  let nodeId = 1;
  const addNodeToNodePage = async () => nodeId++;
  const featuresHashArray = [];
  const draco = true;
  const generageBoundingVolumes = false;
  const shouldMergeMaterials = false;
  const tileContent = await load(FERRY_GLTF_FILE_PATH, Tiles3DLoader);
  const tileTransform = new Matrix4([
    0.8443837640659682, -0.5357387973460459, 0, 0, 0.32832660036003297, 0.5174791372742712,
    0.7902005985709575, 0, -0.42334111834053034, -0.667232555788526, 0.6128482797708588, 0,
    -2703514.4440963655, -4261038.614006309, 3887533.151398322, 1
  ]);
  const tileBoundingVolume = new BoundingSphere([
    -2703528.7614193764, -4261014.993900511, 3887572.9889940596
  ]);
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  const attributeStorageInfo = getAttributeStorageInfo(propertyTable);
  try {
    const convertedResources = await convertB3dmToI3sGeometry(
      tileContent,
      tileTransform,
      tileBoundingVolume,
      addNodeToNodePage,
      propertyTable,
      featuresHashArray,
      attributeStorageInfo,
      draco,
      generageBoundingVolumes,
      shouldMergeMaterials,
      geoidHeightModel,
      {}
    );
    if (!convertedResources?.[0].attributes?.[1]) {
      return;
    }
    const attributes = new Uint8Array(convertedResources[0].attributes[1]);
    const attributesExpected = new Uint8Array(attributeBufferExpected);
    t.deepEquals(attributes, attributesExpected, '64-bit int values converted to strings');
  } finally {
    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

function getAttributeStorageInfo(propertyTable) {
  const attributeTypesMap = getAttributeTypesMapFromPropertyTable(propertyTable);
  const attributeMetadataInfo: AttributeMetadataInfo = new AttributeMetadataInfo();
  attributeMetadataInfo.addMetadataInfo(attributeTypesMap);
  return attributeMetadataInfo.attributeStorageInfo;
}

async function checkNodeResources(resources, expectedValues, t) {
  const {
    draco,
    vertexCount,
    attributesLength,
    featureCount,
    nonCompressedGeometryByteLength,
    compressedGeometryByteLength,
    texture,
    boundingVolumes
  } = expectedValues;
  t.equals(resources.vertexCount, vertexCount);
  t.equals(resources.attributes.length, attributesLength);
  t.equals(resources.featureCount, featureCount);
  t.equals(resources.geometry.length, nonCompressedGeometryByteLength);

  if (draco) {
    t.ok(resources.compressedGeometry instanceof Promise);
    const compressedGeometry = await resources.compressedGeometry;
    t.equals(compressedGeometry.byteLength, compressedGeometryByteLength);
  }

  if (texture) {
    t.equals(resources.texture.mimeType, texture.mimeType);
    t.equals(resources.texture.image.width, texture.width);
    t.equals(resources.texture.image.height, texture.height);
    t.equals(resources.texture.image.data.length, texture.bitmapByteLength);
    t.ok(resources.texture.bufferView);
  } else {
    t.notOk(resources.texture);
  }

  if (boundingVolumes) {
    t.equals(JSON.stringify(resources.boundingVolumes), JSON.stringify(boundingVolumes));
  } else {
    t.notOk(resources.boundingVolumes);
  }
}
