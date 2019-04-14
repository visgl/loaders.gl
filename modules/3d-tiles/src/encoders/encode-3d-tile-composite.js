import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader} from './helpers/encode-3d-tile-header';

// Procedurally encode the tile array buffer for testing purposes
export function encodeComposite3DTile(options = {}) {
  const {tiles = []} = options;
  const tilesLength = tiles.length;

  let tilesByteLength = 0;
  for (let i = 0; i < tilesLength; ++i) {
    tilesByteLength += tiles[i].byteLength;
  }

  const headerByteLength = 16;
  const byteLength = headerByteLength + tilesByteLength;
  const buffer = new ArrayBuffer(byteLength);

  encode3DTileHeader(buffer, 0, {magic: MAGIC_ARRAY.COMPOSITE, ...options, byteLength});

  const view = new DataView(buffer);
  view.setUint32(12, tilesLength, true); // tilesLength

  const uint8Array = new Uint8Array(buffer);
  let byteOffset = headerByteLength;
  for (let i = 0; i < tilesLength; ++i) {
    const tile = new Uint8Array(tiles[i]);
    uint8Array.set(tile, byteOffset);
    byteOffset += tile.byteLength;
  }

  return buffer;
}
