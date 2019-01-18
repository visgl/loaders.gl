import {OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {DracoEncoder, DracoLoader} from '@loaders.gl/draco';

import {PointCloudLayer} from '@deck.gl/layers';

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
console.log(compressedMesh.byteLength);
const kittiPointCloudFromDraco = DracoLoader.parseBinary(compressedMesh).attributes;

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
}

export default [
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
        numInstances: kittiPointCloudFromDraco.POSITION.length / 3,
        instancePositions: kittiPointCloudFromDraco.POSITION,
        instanceColors: new Uint8ClampedArray(kittiPointCloudFromDraco.COLOR_0)
      })
    ],
    referenceImageUrl: './test/render/golden-images/kitti-point-cloud.png'
  }
];
