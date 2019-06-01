import parse3DTile from './parsers/parse-3d-tile';

// Tile3DLoader
export default {
  name: '3D Tiles',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeType: 'application/octet-stream',
  parse,
  binary: true
};

async function parse(arrayBuffer, options, url, loader) {
  const tile = {};
  const byteOffset = 0;
  parse3DTile(arrayBuffer, byteOffset, options, tile);
  return tile;
}
