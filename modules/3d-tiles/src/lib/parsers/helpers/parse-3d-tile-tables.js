// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {getStringFromArrayBuffer} from './parse-utils';

const SIZEOF_UINT32 = 4;

// eslint-disable-next-line max-statements
export function parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset) {
  const view = new DataView(arrayBuffer);
  let batchLength;

  tile.header = tile.header || {};

  let featureTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  let featureTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  let batchTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  let batchTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  // First legacy header format - [batchLength] [batchTableByteLength] ('batchTableJsonByteLength': JSON starts with a quotation mark or the glTF magic)
  // Second legacy format - [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength] (Second legacy format is similar as first but here we check 'batchTableBinaryByteLength' instead)
  // Current header format - [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength]
  // First byte will be 0x22 or 0x67. The minimum uint32 expected is 0x22000000 = 570425344 = 570MB.
  if (batchTableJsonByteLength >= 570425344) {
    byteOffset -= SIZEOF_UINT32 * 2;
    batchLength = featureTableJsonByteLength;
    batchTableJsonByteLength = featureTableBinaryByteLength;
    batchTableBinaryByteLength = 0;
    featureTableJsonByteLength = 0;
    featureTableBinaryByteLength = 0;

    const deprecationWarning = `This b3dm header is using the legacy format [batchLength] [batchTableByteLength].
      The new format spec: https://github.com/CesiumGS/3d-tiles/tree/master/specification/TileFormats/Batched3DModel.`;
    console.warn(deprecationWarning); // eslint-disable-line
  } else if (batchTableBinaryByteLength >= 570425344) {
    byteOffset -= SIZEOF_UINT32;
    batchLength = batchTableJsonByteLength;
    batchTableJsonByteLength = featureTableJsonByteLength;
    batchTableBinaryByteLength = featureTableBinaryByteLength;
    featureTableJsonByteLength = 0;
    featureTableBinaryByteLength = 0;

    const deprecationWarning = `This b3dm header is using the legacy format [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength].
      The new format spec: https://github.com/CesiumGS/3d-tiles/tree/master/specification/TileFormats/Batched3DModel.`;
    console.warn(deprecationWarning); // eslint-disable-line
  }

  tile.header.featureTableJsonByteLength = featureTableJsonByteLength;
  tile.header.featureTableBinaryByteLength = featureTableBinaryByteLength;
  tile.header.batchTableJsonByteLength = batchTableJsonByteLength;
  tile.header.batchTableBinaryByteLength = batchTableBinaryByteLength;
  tile.header.batchLength = batchLength;

  return byteOffset;
}

export function parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options) {
  byteOffset = parse3DTileFeatureTable(tile, arrayBuffer, byteOffset, options);
  byteOffset = parse3DTileBatchTable(tile, arrayBuffer, byteOffset, options);
  return byteOffset;
}

function parse3DTileFeatureTable(tile, arrayBuffer, byteOffset, options) {
  const {featureTableJsonByteLength, featureTableBinaryByteLength, batchLength} = tile.header;

  tile.featureTableJson = {
    BATCH_LENGTH: batchLength || 0
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
