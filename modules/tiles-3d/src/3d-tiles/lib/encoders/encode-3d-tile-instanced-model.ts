// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {copyStringToDataView} from '@loaders.gl/loader-utils';
import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader, encode3DTileByteLength} from './helpers/encode-3d-tile-header';

// Procedurally encode the tile array buffer for testing purposes
// eslint-disable-next-line max-statements
export function encodeInstancedModel3DTile(tile, dataView, byteOffset, options) {
  const {featuresLength = 1, gltfFormat = 1, gltfUri = ''} = tile;

  const gltfUriByteLength = gltfUri.length;

  const featureTableJson = {
    INSTANCES_LENGTH: featuresLength,
    POSITION: new Array(featuresLength * 3).fill(0)
  };
  const featureTableJsonString = JSON.stringify(featureTableJson);
  const featureTableJsonByteLength = featureTableJsonString.length;

  // Add default magic for this tile type
  tile = {magic: MAGIC_ARRAY.INSTANCED_MODEL, ...tile};

  const byteOffsetStart = byteOffset;

  byteOffset = encode3DTileHeader(tile, dataView, 0);

  if (dataView) {
    dataView.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
    dataView.setUint32(16, 0, true); // featureTableBinaryByteLength
    dataView.setUint32(20, 0, true); // batchTableJsonByteLength
    dataView.setUint32(24, 0, true); // batchTableBinaryByteLength
    dataView.setUint32(28, gltfFormat, true); // gltfFormat
  }

  byteOffset += 20;

  byteOffset += copyStringToDataView(
    dataView,
    byteOffset,
    featureTableJsonString,
    featureTableJsonByteLength
  );
  byteOffset += copyStringToDataView(dataView, byteOffset, gltfUri, gltfUriByteLength);

  // Go "back" and rewrite the tile's `byteLength` now that we know the value
  encode3DTileByteLength(dataView, byteOffsetStart, byteOffset - byteOffsetStart);

  return byteOffset;
}
