import {OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {DracoEncoder, DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';

import {PointCloudLayer} from '@deck.gl/layers';

// LAZ
const LAS_BINARY = require('test-data/las/indoor.laz');
const lazPointCloud = LASLoader.parseBinary(LAS_BINARY, {skip: 100});

// Raw point cloud data
const KITTI_POSITIONS = require('test-data/raw-attribute-buffers/lidar-positions.bin');
const KITTI_COLORS = require('test-data/raw-attribute-buffers/lidar-colors.bin');
const kittiPointCloudRaw = {
  POSITION: new Float32Array(KITTI_POSITIONS),
  COLOR: new Uint8ClampedArray(KITTI_COLORS)
};

// Encode/decode mesh with Draco
const dracoEncoder = new DracoEncoder({
  quantization: {
    POSITION: 14
  }
});
const compressedMesh = dracoEncoder.encodePointCloud(kittiPointCloudRaw);
dracoEncoder.destroy();
// eslint-disable-next-line
// console.log(compressedMesh.byteLength);
const kittiPointCloudFromDraco = DracoLoader.parseBinary(compressedMesh);

const viewProps = {
  views: [new OrbitView({
    fov: 30,
    near: 1,
    far: 10000
  })],
  viewState: {
    lookAt: [0, 0, 0],
    distance: 50,
    rotationOrbit: 90,
    zoom: 1
  }
};

const layerProps = {
  opacity: 1,
  coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
  radiusPixels: 50,
  lightSettings: {
    ambientRatio: 1,
    diffuseRatio: 0,
    specularRatio: 0
  }
};

export default [
  {
    name: 'laz-pointcloud-test',
    renderingTimes: 1,
    ...viewProps,
    viewState: {
      lookAt: [
        (lazPointCloud.originalHeader.mins[0] + lazPointCloud.originalHeader.maxs[0]) / 2,
        (lazPointCloud.originalHeader.mins[1] + lazPointCloud.originalHeader.maxs[1]) / 2,
        (lazPointCloud.originalHeader.mins[2] + lazPointCloud.originalHeader.maxs[2]) / 2
      ],
      distance: 50,
      zoom: 1.5
    },
    layers: [
      new PointCloudLayer({
        id: 'laz-pointcloud-test',
        ...layerProps,
        radiusPixels: 20,
        numInstances: lazPointCloud.header.vertexCount,
        instancePositions: lazPointCloud.attributes.POSITION,
        instanceColors: lazPointCloud.attributes.COLOR_0
      })
    ],
    referenceImageUrl: './test/render/golden-images/laz-indoor.png'
  },
  {
    name: 'kitti-pointcloud-test',
    renderingTimes: 1,
    ...viewProps,
    layers: [
      new PointCloudLayer({
        id: 'kitti-pointcloud-test',
        ...layerProps,
        numInstances: kittiPointCloudRaw.POSITION.length / 3,
        instancePositions: kittiPointCloudRaw.POSITION,
        instanceColors: kittiPointCloudRaw.COLOR
      })
    ],
    referenceImageUrl: './test/render/golden-images/kitti-point-cloud.png'
  },
  {
    name: 'draco-pointcloud-test',
    renderingTimes: 1,
    ...viewProps,
    layers: [
      new PointCloudLayer({
        id: 'draco-pointcloud-test',
        ...layerProps,
        numInstances: kittiPointCloudFromDraco.header.vertexCount,
        instancePositions: kittiPointCloudFromDraco.attributes.POSITION,
        instanceColors: new Uint8ClampedArray(kittiPointCloudFromDraco.attributes.COLOR_0)
      })
    ],
    referenceImageUrl: './test/render/golden-images/kitti-point-cloud.png'
  }
];
