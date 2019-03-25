import {parseFileSync} from '@loaders.gl/core';
import {DracoEncoder, DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';

import {getModel, drawModelInViewport} from '../test-utils/get-model';

// LAZ
const LAS_BINARY = require('@loaders.gl/las/test/data/indoor.laz');

// Raw point cloud data
const KITTI_POSITIONS = require('@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin');
const KITTI_COLORS = require('@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-colors.bin');
const kittiPointCloudRaw = {
  POSITION: new Float32Array(KITTI_POSITIONS),
  COLOR_0: new Uint8ClampedArray(KITTI_COLORS)
};

export default [
  {
    name: 'LAZ pointcloud',
    disabled: true, // Seems breaking on master
    onInitialize: ({gl}) => {
      const lazPointCloud = parseFileSync(LAS_BINARY, LASLoader, {skip: 10});
      const model = getModel(gl, lazPointCloud);
      return {model, lazPointCloud};
    },
    onRender: ({model, lazPointCloud, done}) => {
      const originalHeader = lazPointCloud.loaderData.header;
      const viewport = {
        lookAt: [
          (originalHeader.mins[0] + originalHeader.maxs[0]) / 2,
          (originalHeader.mins[1] + originalHeader.maxs[1]) / 2,
          (originalHeader.mins[2] + originalHeader.maxs[2]) / 2
        ],
        distance: 50,
        zoom: 2
      };
      drawModelInViewport(model, viewport);
      done();
    },
    timeout: 10000,
    goldenImage: './test/render/golden-images/laz-indoor.png'
  },
  {
    name: 'KITTI pointcloud raw',
    onInitialize: ({gl}) => {
      const model = getModel(gl, {
        attributes: {
          POSITION: {value: kittiPointCloudRaw.POSITION, size: 3},
          COLOR_0: {value: kittiPointCloudRaw.COLOR_0, size: 4}
        },
        mode: 0
      });
      return {model};
    },
    onRender: ({model, done}) => {
      drawModelInViewport(model, {distance: 50, rotationZ: 90});
      done();
    },
    goldenImage: './test/render/golden-images/kitti-point-cloud.png'
  },
  {
    name: 'Draco pointcloud',
    onInitialize: ({gl}) => {
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
      const kittiPointCloudFromDraco = parseFileSync(compressedMesh, DracoLoader);
      const model = getModel(gl, kittiPointCloudFromDraco);
      return {model};
    },
    onRender: ({model, done}) => {
      drawModelInViewport(model, {distance: 50, rotationZ: 90});
      done();
    },
    goldenImage: './test/render/golden-images/kitti-point-cloud.png'
  }
];
