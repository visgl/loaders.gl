"use strict";module.export({parse3DTileTablesHeaderSync:()=>parse3DTileTablesHeaderSync,parse3DTileTablesSync:()=>parse3DTileTablesSync});var getStringFromArrayBuffer;module.link('./parse-utils',{getStringFromArrayBuffer(v){getStringFromArrayBuffer=v}},0);

const SIZEOF_UINT32 = 4;

// eslint-disable-next-line max-statements
function parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset) {
  const view = new DataView(arrayBuffer);

  tile.featureTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.featureTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.batchTableJsonByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.batchTableBinaryByteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  return byteOffset;
}

function parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options) {
  byteOffset = parse3DTileFeatureTable(tile, arrayBuffer, byteOffset, options);
  byteOffset = parse3DTileBatchTable(tile, arrayBuffer, byteOffset, options);
  return byteOffset;
}

function parse3DTileFeatureTable(tile, arrayBuffer, byteOffset, options) {
  const {featureTableJsonByteLength, featureTableBinaryByteLength} = tile;

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
  const {batchTableJsonByteLength, batchTableBinaryByteLength} = tile;

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
