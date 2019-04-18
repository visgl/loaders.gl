import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader, encode3DTileByteLength} from './helpers/encode-3d-tile-header';

export function encodeComposite3DTile(tile, dataView, byteOffset, options, encode3DTile) {
  const {tiles = []} = tile;
  const tilesLength = tiles.length;

  // Add default magic for this tile type
  tile = {magic: MAGIC_ARRAY.COMPOSITE, ...tile};

  const byteOffsetStart = byteOffset;
  byteOffset += encode3DTileHeader(tile, dataView, byteOffset);

  if (dataView) {
    dataView.setUint32(byteOffset, tilesLength, true); // tilesLength
  }
  byteOffset += 4;

  for (let i = 0; i < tilesLength; ++i) {
    byteOffset += encode3DTile(tiles[i], dataView, byteOffset, options);
  }

  // Go "back" and rewrite the tile's `byteLength` now that we know the value
  encode3DTileByteLength(dataView, byteOffsetStart, byteOffset - byteOffsetStart);

  return byteOffset;
}
