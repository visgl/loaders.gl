// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {expect, test} from 'vitest';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import {load, parseSync, encodeSync, LoaderContext, coreApi} from '@loaders.gl/core';
import {Tiles3DLoader, Tile3DWriter, TILE3D_TYPE} from '@loaders.gl/3d-tiles';
import {loadDraco} from '../../../src/lib/parsers/parse-3d-tile-point-cloud';
// import {loadRootTileFromTileset} from '../utils/load-utils';
/*
const POINTCLOUD_RGB_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudRGB/tileset.json';
const POINTCLOUD_RGBA_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudRGBA/tileset.json';
const POINTCLOUD_RGB565_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudRGB565/tileset.json';
const POINTCLOUD_NO_COLOR_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudNoColor/tileset.json';
const POINTCLOUD_CONSTANT_COLOR_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudConstantColor/tileset.json';
const POINTCLOUD_NORMALS_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudNormals/tileset.json';
const POINTCLOUD_NORMALS_OCT_ENCODED_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudNormalsOctEncoded/tileset.json';
const POINTCLOUD_QUANTIZED_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudQuantized/tileset.json';
const POINTCLOUD_QUANTIZED_OCT_ENCODED_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudQuantizedOctEncoded/tileset.json';
const POINTCLOUD_DRACO_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudDraco/tileset.json';
const POINTCLOUD_DRACO_PARTIAL_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudDracoPartial/tileset.json';
const POINTCLOUD_DRACO_BATCHED_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudDracoBatched/tileset.json';
const POINTCLOUD_WGS84_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudWGS84/tileset.json';
const POINTCLOUD_BATCHED_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudBatched/tileset.json';
const POINTCLOUD_WITH_PER_POINT_PROPERTIES_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudWithPerPointProperties/tileset.json';
const POINTCLOUD_WITH_TRANSFORM_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/PointCloud/PointCloudWithTransform/tileset.json';
const POINTCLOUD_TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetPoints/tileset.json';
*/
test('point cloud tile#throws with invalid version', () => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    version: 2
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  expect(() => parseSync(arrayBuffer, Tiles3DLoader), 'throws on invalid version').toThrow();
});
test('point cloud tile#throws if featureTableJsonByteLength is 0', () => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJsonByteLength: 0
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  expect(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'throws if featureTableJsonByteLength is 0'
  ).toThrow();
});
test('point cloud tile#throws if the feature table does not contain POINTS_LENGTH', () => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJson: {
      POSITION: {
        byteOffset: 0
      }
    }
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  expect(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'throws if the feature table does not contain POINTS_LENGTH'
  ).toThrow();
});
test('point cloud tile#throws if the feature table does not contain POSITION or POSITION_QUANTIZED', () => {
  const TILE = {
    type: TILE3D_TYPE.POINT_CLOUD,
    featureTableJson: {
      POINTS_LENGTH: 1
    }
  };
  const arrayBuffer = encodeSync(TILE, Tile3DWriter);
  expect(
    () => parseSync(arrayBuffer, Tiles3DLoader),
    'throws if feature table has no POSITION or POSITION_QUANTIZED'
  ).toThrow();
});
test('loadDraco# Pass options to draco loader properly', async () => {
  const resultObject = {
    draco: {
      decoderType: 'js',
      extraAttributes: {test: 'yes'}
    },
    worker: true,
    reuseWorkers: true
  };
  const context: LoaderContext = {
    coreApi,
    _parse: async (buffer, loader, resultOptions) => {
      expect(resultOptions).toEqual(resultObject);
      expect(resultOptions?.['3d-tiles']).toBe(undefined);
      return {attributes: {}};
    }
  } as LoaderContext;
  const dracoData = {buffer: null, batchTableProperties: {test: 'yes'}};
  const options: DracoLoaderOptions = {
    draco: {
      decoderType: 'js'
    },
    '3d-tiles': 'test 3d-tiles',
    worker: true,
    reuseWorkers: true
  };
  await loadDraco({shape: 'tile3d'}, dracoData, options, context);
});
