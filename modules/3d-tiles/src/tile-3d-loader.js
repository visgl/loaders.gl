import {parse3DTile, parse3DTileSync} from './parsers/parse-3d-tile';

// Tile3DLoader
export default {
  name: '3D Tiles',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeType: 'application/octet-stream',
  parse,
  parseSync,
  binary: true
};

async function parse(arrayBuffer, options, url, loader) {
  const tile = {};
  const byteOffset = 0;
  parse3DTile(arrayBuffer, byteOffset, options, tile);
  return tile;
}

function parseSync(arrayBuffer, options, url, loader) {
  const tile = {};
  const byteOffset = 0;
  parse3DTileSync(arrayBuffer, byteOffset, options, tile);
  return tile;
}
