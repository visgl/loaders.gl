// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {TILE3D_TYPE} from '../constants';
import {assert} from '@loaders.gl/loader-utils';

import {encodeComposite3DTile} from './encode-3d-tile-composite';
import {encodeBatchedModel3DTile} from './encode-3d-tile-batched-model';
import {encodeInstancedModel3DTile} from './encode-3d-tile-instanced-model';
import {encodePointCloud3DTile} from './encode-3d-tile-point-cloud';

export default function encode3DTile(tile, options) {
  const byteLength = encode3DTileToDataView(tile, null, 0, options);
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  encode3DTileToDataView(tile, dataView, 0, options);
  return arrayBuffer;
}

function encode3DTileToDataView(tile, dataView, byteOffset, options) {
  assert(typeof tile.type === 'string');

  switch (tile.type) {
    case TILE3D_TYPE.COMPOSITE:
      return encodeComposite3DTile(tile, dataView, byteOffset, options, encode3DTileToDataView);
    case TILE3D_TYPE.POINT_CLOUD:
      return encodePointCloud3DTile(tile, dataView, byteOffset, options);
    case TILE3D_TYPE.BATCHED_3D_MODEL:
      return encodeBatchedModel3DTile(tile, dataView, byteOffset, options);
    case TILE3D_TYPE.INSTANCED_3D_MODEL:
      return encodeInstancedModel3DTile(tile, dataView, byteOffset, options);
    default:
      throw new Error('3D Tiles: unknown tile type');
  }
}
