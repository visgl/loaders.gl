"use strict";module.export({encodePointCloud3DTile:()=>encodePointCloud3DTile});var MAGIC_ARRAY;module.link('../constants',{MAGIC_ARRAY(v){MAGIC_ARRAY=v}},0);var encode3DTileHeader,encode3DTileByteLength;module.link('./helpers/encode-3d-tile-header',{encode3DTileHeader(v){encode3DTileHeader=v},encode3DTileByteLength(v){encode3DTileByteLength=v}},1);var padStringToByteAlignment,copyStringToDataView,copyBinaryToDataView;module.link('./helpers/encode-utils',{padStringToByteAlignment(v){padStringToByteAlignment=v},copyStringToDataView(v){copyStringToDataView=v},copyBinaryToDataView(v){copyBinaryToDataView=v}},2);







const DEFAULT_FEATURE_TABLE_JSON = {
  POINTS_LENGTH: 1,
  POSITIONS: {
    byteOffset: 0
  }
};

function encodePointCloud3DTile(tile, dataView, byteOffset, options) {
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
