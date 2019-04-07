// This code is inspired by
import {getMagicString} from './parse-utils';

const SIZEOF_UINT32 = 4;

// PARSE FIXED HEADER
// eslint-disable-next-line max-statements
export function parse3DTileHeaderSync(tile, arrayBuffer, byteOffset = 0) {
  const view = new DataView(arrayBuffer);

  const magic = view.getUint32(byteOffset, true);
  const type = getMagicString(arrayBuffer, byteOffset);
  byteOffset += SIZEOF_UINT32;

  const version = view.getUint32(byteOffset, true);

  // TODO - move version check into each tile parser?
  if (version !== 1) {
    throw new Error('3D Tile Version');
  }
  byteOffset += SIZEOF_UINT32;

  const byteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  Object.assign(tile, {
    magic, // identifies type of tile
    type, // String version of magic
    version,
    byteLength
  });

  return byteOffset // Indicates where the parsing ended
}
