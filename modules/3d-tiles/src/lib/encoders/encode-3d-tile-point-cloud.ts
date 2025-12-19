// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader, encode3DTileByteLength} from './helpers/encode-3d-tile-header';
import {
  padStringToByteAlignment,
  copyStringToDataView,
  copyBinaryToDataView
} from '@loaders.gl/loader-utils';

const DEFAULT_FEATURE_TABLE_JSON = {
  POINTS_LENGTH: 1,
  POSITIONS: {
    byteOffset: 0
  }
};

export function encodePointCloud3DTile(tile, dataView, byteOffset, options) {
  const {featureTableJson = DEFAULT_FEATURE_TABLE_JSON} = tile;

  let featureTableJsonString = JSON.stringify(featureTableJson);
  featureTableJsonString = padStringToByteAlignment(featureTableJsonString, 4);

  const {featureTableJsonByteLength = featureTableJsonString.length} = tile;

  const featureTableBinary = new ArrayBuffer(12); // Enough space to hold 3 floats
  const featureTableBinaryByteLength = featureTableBinary.byteLength;

  // Add default magic for this tile type
  tile = {magic: MAGIC_ARRAY.POINT_CLOUD, ...tile};

  const byteOffsetStart = byteOffset;

  byteOffset += encode3DTileHeader(tile, dataView, 0);

  if (dataView) {
    dataView.setUint32(byteOffset + 0, featureTableJsonByteLength, true); // featureTableJsonByteLength
    dataView.setUint32(byteOffset + 4, featureTableBinaryByteLength, true); // featureTableBinaryByteLength
    dataView.setUint32(byteOffset + 8, 0, true); // batchTableJsonByteLength
    dataView.setUint32(byteOffset + 12, 0, true); // batchTableBinaryByteLength
  }
  byteOffset += 16;

  byteOffset += copyStringToDataView(
    dataView,
    byteOffset,
    featureTableJsonString,
    featureTableJsonByteLength
  );
  byteOffset += copyBinaryToDataView(
    dataView,
    byteOffset,
    featureTableBinary,
    featureTableBinaryByteLength
  );

  // Go "back" and rewrite the tile's `byteLength` now that we know the value
  encode3DTileByteLength(dataView, byteOffsetStart, byteOffset - byteOffsetStart);

  return byteOffset;
}
