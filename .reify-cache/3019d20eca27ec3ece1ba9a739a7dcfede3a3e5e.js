"use strict";module.export({encodeInstancedModel3DTile:()=>encodeInstancedModel3DTile});var MAGIC_ARRAY;module.link('../constants',{MAGIC_ARRAY(v){MAGIC_ARRAY=v}},0);var encode3DTileHeader,encode3DTileByteLength;module.link('./helpers/encode-3d-tile-header',{encode3DTileHeader(v){encode3DTileHeader=v},encode3DTileByteLength(v){encode3DTileByteLength=v}},1);var copyStringToDataView;module.link('./helpers/encode-utils',{copyStringToDataView(v){copyStringToDataView=v}},2);



// Procedurally encode the tile array buffer for testing purposes
// eslint-disable-next-line max-statements
function encodeInstancedModel3DTile(tile, dataView, byteOffset, options) {
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

  encode3DTileHeader(tile, dataView, 0);

  if (dataView) {
    dataView.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
    dataView.setUint32(16, 0, true); // featureTableBinaryByteLength
    dataView.setUint32(20, 0, true); // batchTableJsonByteLength
    dataView.setUint32(24, 0, true); // batchTableBinaryByteLength
    dataView.setUint32(28, gltfFormat, true); // gltfFormat
  }

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
