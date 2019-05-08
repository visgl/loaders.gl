"use strict";module.export({default:()=>parse3DTileSync});var TILE3D_TYPE;module.link('../constants',{TILE3D_TYPE(v){TILE3D_TYPE=v}},0);var getMagicString;module.link('./helpers/parse-utils',{getMagicString(v){getMagicString=v}},1);var parsePointCloud3DTileSync;module.link('./parse-3d-tile-point-cloud',{default(v){parsePointCloud3DTileSync=v}},2);var parseBatchedModel3DTileSync;module.link('./parse-3d-tile-batched-model',{default(v){parseBatchedModel3DTileSync=v}},3);var parseInstancedModel3DTileSync;module.link('./parse-3d-tile-instanced-model',{default(v){parseInstancedModel3DTileSync=v}},4);var parseComposite3DTileSync;module.link('./parse-3d-tile-composite',{default(v){parseComposite3DTileSync=v}},5);







// Extracts
function parse3DTileSync(arrayBuffer, byteOffset = 0, options = {}, tile = {}) {
  tile.byteOffset = byteOffset;
  tile.type = getMagicString(arrayBuffer, byteOffset);

  switch (tile.type) {
    case TILE3D_TYPE.COMPOSITE:
      // Note: We pass this function as argument so that embedded tiles can be parsed recursively
      parseComposite3DTileSync(tile, arrayBuffer, byteOffset, options, parse3DTileSync);
      break;

    case TILE3D_TYPE.BATCHED_3D_MODEL:
      parseBatchedModel3DTileSync(tile, arrayBuffer, byteOffset, options);
      break;

    case TILE3D_TYPE.INSTANCED_3D_MODEL:
      parseInstancedModel3DTileSync(tile, arrayBuffer, byteOffset, options);
      break;

    case TILE3D_TYPE.POINT_CLOUD:
      parsePointCloud3DTileSync(tile, arrayBuffer, byteOffset, options);
      break;

    default:
      throw new Error(`3DTileLoader: unknown type ${tile.type}`); // eslint-disable-line
  }

  return tile;
}
