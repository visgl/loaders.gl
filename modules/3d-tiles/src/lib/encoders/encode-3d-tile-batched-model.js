// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {copyStringToDataView} from '@loaders.gl/loader-utils';
import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader, encode3DTileByteLength} from './helpers/encode-3d-tile-header';

// Procedurally encode the tile array dataView for testing purposes
export function encodeBatchedModel3DTile(tile, dataView, byteOffset, options) {
  const {featuresLength = 1} = tile;

  const featureTableJson = {
    BATCH_LENGTH: featuresLength
  };
  const featureTableJsonString = JSON.stringify(featureTableJson);
  const featureTableJsonByteLength = featureTableJsonString.length;

  // Add default magic for this tile type
  tile = {magic: MAGIC_ARRAY.BATCHED_MODEL, ...tile};

  const byteOffsetStart = byteOffset;

  byteOffset = encode3DTileHeader(tile, dataView, byteOffset);

  if (dataView) {
    dataView.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
    dataView.setUint32(16, 0, true); // featureTableBinaryByteLength
    dataView.setUint32(20, 0, true); // batchTableJsonByteLength
    dataView.setUint32(24, 0, true); // batchTableBinaryByteLength
  }
  byteOffset += 16;

  // TODO feature table binary
  byteOffset += copyStringToDataView(
    dataView,
    byteOffset,
    featureTableJsonString,
    featureTableJsonByteLength
  );
  // TODO batch table

  // Go "back" and rewrite the tile's `byteLength` now that we know the value
  encode3DTileByteLength(dataView, byteOffsetStart, byteOffset - byteOffsetStart);

  return byteOffset;
}
