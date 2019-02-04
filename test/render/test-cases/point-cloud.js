import {DracoEncoder, DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';

import {getModel, drawModelInViewport} from '../test-utils/get-model';

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

export default [
  {
    name: 'LAZ pointcloud',
    onRender: ({gl}) => {
      const model = getModel(gl, lazPointCloud);
      const viewport = {
        lookAt: [
          (lazPointCloud.originalHeader.mins[0] + lazPointCloud.originalHeader.maxs[0]) / 2,
          (lazPointCloud.originalHeader.mins[1] + lazPointCloud.originalHeader.maxs[1]) / 2,
          (lazPointCloud.originalHeader.mins[2] + lazPointCloud.originalHeader.maxs[2]) / 2
        ],
        distance: 50,
        zoom: 2
      };
      drawModelInViewport(model, viewport);
    },
    goldenImage: './test/render/golden-images/laz-indoor.png'
  },
  {
    name: 'KITTI pointcloud raw',
    onRender: ({gl}) => {
      const model = getModel(gl, {attributes: kittiPointCloudRaw});
      drawModelInViewport(model, {distance: 50, rotationZ: 90});
    },
    goldenImage: './test/render/golden-images/kitti-point-cloud.png'
  },
  {
    name: 'Draco pointcloud',
    onRender: ({gl}) => {
      const model = getModel(gl, kittiPointCloudFromDraco);
      drawModelInViewport(model, {distance: 50, rotationZ: 90});
    },
    goldenImage: './test/render/golden-images/kitti-point-cloud.png'
  }
];
