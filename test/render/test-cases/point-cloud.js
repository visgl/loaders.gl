import {load, fetchFile, parse, encode} from '@loaders.gl/core';
import {DracoWriter, DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';

import {getModel, drawModelInViewport} from '../test-utils/get-model';

// LAZ
const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';

// Raw point cloud data URLS
const KITTI_POSITIONS_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/draco/test/data/raw-attribute-buffers/lidar-positions.bin';
const KITTI_COLORS_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/draco/test/data/raw-attribute-buffers/lidar-colors.bin';

// Load big cloud only once...
let kittiPointCloud;

async function loadKittiPointCloud() {
  const KITTI_POSITIONS = await fetchFile(KITTI_POSITIONS_URL).then((res) => res.arrayBuffer());
  const KITTI_COLORS = await fetchFile(KITTI_COLORS_URL).then((res) => res.arrayBuffer());

  if (!kittiPointCloud) {
    kittiPointCloud = {
      POSITION: new Float32Array(KITTI_POSITIONS),
      COLOR_0: new Uint8ClampedArray(KITTI_COLORS)
    };
  }

  return kittiPointCloud;
}

export default [
  {
    name: 'LAZ pointcloud',
    disabled: true, // Seems breaking on master
    onInitialize: async ({gl}) => {
      const lazPointCloud = await load(LAS_BINARY_URL, LASLoader, {skip: 10});
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
    onInitialize: async ({gl}) => {
      const kittiPointCloudRaw = await loadKittiPointCloud();
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
    onInitialize: async ({gl}) => {
      const kittiPointCloudRaw = await loadKittiPointCloud();
      // Encode/decode mesh with Draco
      const compressedMesh = await encode({attributes: kittiPointCloudRaw}, DracoWriter, {
        draco: {
          pointcloud: true,
          quantization: {
            POSITION: 14
          }
        }
      });

      // eslint-disable-next-line
      // console.log(compressedMesh.byteLength);
      const kittiPointCloudFromDraco = await parse(compressedMesh, DracoLoader);
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
