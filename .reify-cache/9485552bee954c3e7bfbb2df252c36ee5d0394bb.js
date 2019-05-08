"use strict";module.export({encodeComposite3DTile:()=>encodeComposite3DTile});var MAGIC_ARRAY;module.link('../constants',{MAGIC_ARRAY(v){MAGIC_ARRAY=v}},0);var encode3DTileHeader,encode3DTileByteLength;module.link('./helpers/encode-3d-tile-header',{encode3DTileHeader(v){encode3DTileHeader=v},encode3DTileByteLength(v){encode3DTileByteLength=v}},1);


function encodeComposite3DTile(tile, dataView, byteOffset, options, encode3DTile) {
  // Add default magic for this tile type
  tile = {magic: MAGIC_ARRAY.COMPOSITE, tiles: [], ...tile};

  const byteOffsetStart = byteOffset;

  byteOffset += encode3DTileHeader(tile, dataView, byteOffset);

  if (dataView) {
    dataView.setUint32(byteOffset, tile.tiles.length, true); // tilesLength
  }
  byteOffset += 4;

  for (let i = 0; i < tile.tiles.length; ++i) {
    byteOffset += encode3DTile(tile.tiles[i], dataView, byteOffset, options);
  }

  // Go "back" and rewrite the tile's `byteLength` now that we know the value
  encode3DTileByteLength(dataView, byteOffsetStart, byteOffset - byteOffsetStart);

  return byteOffset;
}
