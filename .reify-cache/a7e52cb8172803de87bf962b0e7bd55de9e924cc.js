"use strict";module.export({default:()=>parseBatchedModel3DTileSync});var GL;module.link('../math/gl-constants',{default(v){GL=v}},0);var Tile3DFeatureTable;module.link('../classes/tile-3d-feature-table',{default(v){Tile3DFeatureTable=v}},1);var parse3DTileHeaderSync;module.link('./helpers/parse-3d-tile-header',{parse3DTileHeaderSync(v){parse3DTileHeaderSync=v}},2);var parse3DTileTablesHeaderSync,parse3DTileTablesSync;module.link('./helpers/parse-3d-tile-tables',{parse3DTileTablesHeaderSync(v){parse3DTileTablesHeaderSync=v},parse3DTileTablesSync(v){parse3DTileTablesSync=v}},3);var parse3DTileGLTFViewSync;module.link('./helpers/parse-3d-tile-gltf-view',{parse3DTileGLTFViewSync(v){parse3DTileGLTFViewSync=v}},4);

// import Tile3DBatchTable from '../classes/tile-3d-batch-table';





// eslint-disable-next-line max-statements
function parseBatchedModel3DTileSync(tile, arrayBuffer, byteOffset, options) {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset, options);

  byteOffset = parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset, options);
  byteOffset = parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options);

  byteOffset = parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset, options);

  const featureTable = new Tile3DFeatureTable(tile.featureTableJson, tile.featureTableBinary);
  tile.rtcCenter = featureTable.getGlobalProperty('RTC_CENTER', GL.FLOAT, 3);

  return byteOffset;
}
