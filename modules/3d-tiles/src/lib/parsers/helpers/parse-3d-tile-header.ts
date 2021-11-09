// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

const SIZEOF_UINT32 = 4;

/* PARSE FIXED HEADER:
Populates
  magic, // identifies type of tile
  type, // String version of magic
  version,
  byteLength
 */
export function parse3DTileHeaderSync(tile, arrayBuffer, byteOffset = 0) {
  const view = new DataView(arrayBuffer);

  tile.magic = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.version = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  tile.byteLength = view.getUint32(byteOffset, true);
  byteOffset += SIZEOF_UINT32;

  // TODO - move version check into each tile parser?
  if (tile.version !== 1) {
    throw new Error(`3D Tile Version ${tile.version} not supported`);
  }

  return byteOffset; // Indicates where the parsing ended
}
