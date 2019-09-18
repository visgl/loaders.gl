// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {getStringFromArrayBuffer} from './parse-utils';

const SIZEOF_UINT32 = 4;

// eslint-disable-next-line max-statements
export function parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset) {
  const view = new DataView(arrayBuffer);

  tile.header = tile.header || {};

  tile.header.featureTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.header.featureTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.header.batchTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.header.batchTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  return byteOffset;
}

export function parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options) {
  byteOffset = parse3DTileFeatureTable(tile, arrayBuffer, byteOffset, options);
  byteOffset = parse3DTileBatchTable(tile, arrayBuffer, byteOffset, options);
  return byteOffset;
}

function parse3DTileFeatureTable(tile, arrayBuffer, byteOffset, options) {
  const {featureTableJsonByteLength, featureTableBinaryByteLength} = tile.header;

  tile.featureTableJson = {
    BATCH_LENGTH: 0
  };

  if (featureTableJsonByteLength > 0) {
    const featureTableString = getStringFromArrayBuffer(
      arrayBuffer,
      byteOffset,
      featureTableJsonByteLength
    );
    tile.featureTableJson = JSON.parse(featureTableString);
  }
  byteOffset += featureTableJsonByteLength;

  tile.featureTableBinary = new Uint8Array(arrayBuffer, byteOffset, featureTableBinaryByteLength);
  byteOffset += featureTableBinaryByteLength;

  /*
  const featureTable = parseFeatureTable(featureTableJson, featureTableBinary);

  const batchLength = featureTable.getGlobalProperty('BATCH_LENGTH');
  featureTable.featuresLength = batchLength;
  */

  return byteOffset;
}

function parse3DTileBatchTable(tile, arrayBuffer, byteOffset, options) {
  const {batchTableJsonByteLength, batchTableBinaryByteLength} = tile.header;

  if (batchTableJsonByteLength > 0) {
    const batchTableString = getStringFromArrayBuffer(
      arrayBuffer,
      byteOffset,
      batchTableJsonByteLength
    );
    tile.batchTableJson = JSON.parse(batchTableString);
    byteOffset += batchTableJsonByteLength;

    if (batchTableBinaryByteLength > 0) {
      // Has a batch table binary
      tile.batchTableBinary = new Uint8Array(arrayBuffer, byteOffset, batchTableBinaryByteLength);
      // Copy the batchTableBinary section and let the underlying ArrayBuffer be freed
      tile.batchTableBinary = new Uint8Array(tile.batchTableBinary);

      byteOffset += batchTableBinaryByteLength;
    }
  }

  return byteOffset;
}
