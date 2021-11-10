// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// Reference code:
// https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Scene/Composite3DTileContent.js#L182

import {parse3DTileHeaderSync} from './helpers/parse-3d-tile-header';

// eslint-disable-next-line max-params
export async function parseComposite3DTile(
  tile,
  arrayBuffer,
  byteOffset,
  options,
  context,
  parse3DTile
) {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset);

  const view = new DataView(arrayBuffer);

  // Extract number of tiles
  tile.tilesLength = view.getUint32(byteOffset, true);
  byteOffset += 4;

  // extract each tile from the byte stream
  tile.tiles = [];
  while (tile.tiles.length < tile.tilesLength && tile.byteLength - byteOffset > 12) {
    const subtile = {};
    tile.tiles.push(subtile);
    byteOffset = await parse3DTile(arrayBuffer, byteOffset, options, context, subtile);
    // TODO - do we need to add any padding in between tiles?
  }

  return byteOffset;
}
