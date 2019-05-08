"use strict";module.export({encodeBatchedModel3DTile:()=>encodeBatchedModel3DTile});var MAGIC_ARRAY;module.link('../constants',{MAGIC_ARRAY(v){MAGIC_ARRAY=v}},0);var encode3DTileHeader,encode3DTileByteLength;module.link('./helpers/encode-3d-tile-header',{encode3DTileHeader(v){encode3DTileHeader=v},encode3DTileByteLength(v){encode3DTileByteLength=v}},1);var copyStringToDataView;module.link('./helpers/encode-utils',{copyStringToDataView(v){copyStringToDataView=v}},2);



// Procedurally encode the tile array dataView for testing purposes
function encodeBatchedModel3DTile(tile, dataView, byteOffset, options) {
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
