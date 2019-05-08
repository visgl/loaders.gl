"use strict";module.export({default:()=>encode3DTile});var TILE3D_TYPE;module.link('../constants',{TILE3D_TYPE(v){TILE3D_TYPE=v}},0);var assert;module.link('../utils/assert',{default(v){assert=v}},1);var encodeComposite3DTile;module.link('./encode-3d-tile-composite',{encodeComposite3DTile(v){encodeComposite3DTile=v}},2);var encodeBatchedModel3DTile;module.link('./encode-3d-tile-batched-model',{encodeBatchedModel3DTile(v){encodeBatchedModel3DTile=v}},3);var encodeInstancedModel3DTile;module.link('./encode-3d-tile-instanced-model',{encodeInstancedModel3DTile(v){encodeInstancedModel3DTile=v}},4);var encodePointCloud3DTile;module.link('./encode-3d-tile-point-cloud',{encodePointCloud3DTile(v){encodePointCloud3DTile=v}},5);







function encode3DTile(tile, options) {
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
