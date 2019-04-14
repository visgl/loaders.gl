import {parse3DTileHeaderSync} from './helpers/parse-3d-tile-header';

// Reference code:
// https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Scene/Composite3DTileContent.js#L182
export default function parseComposite3DTileSync(
  tile,
  arrayBuffer,
  byteOffset,
  options,
  parse3DTileSync
) {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset, options);

  const view = new DataView(arrayBuffer);

  // Extract number of tiles
  tile.tilesLength = view.getUint32(byteOffset, true);
  byteOffset += 4;

  // extract each tile from the byte stream
  tile.tiles = [];
  while (tile.tiles.length < tile.tilesLength && tile.byteLength - byteOffset > 12) {
    const subtile = {};
    tile.tiles.push(subtile);
    byteOffset = parse3DTileSync(arrayBuffer, byteOffset, options, subtile);
    // TODO - do we need to add any padding in between tiles?
  }

  return byteOffset;
}
