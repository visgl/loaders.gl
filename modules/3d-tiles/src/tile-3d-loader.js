import {parse3DTile, parse3DTileSync} from './parsers/parse-3d-tile';

async function parse(arrayBuffer, options, context, loader) {
  const tile = {};
  const byteOffset = 0;
  await parse3DTile(arrayBuffer, byteOffset, options, context, tile);
  return tile;
}

function parseSync(arrayBuffer, options, context, loader) {
  const tile = {};
  const byteOffset = 0;
  parse3DTileSync(arrayBuffer, byteOffset, options, context, tile);
  return tile;
}

// Tile3DLoader
export default {
  name: '3D Tiles',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeType: 'application/octet-stream',
  test: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  parse,
  parseSync,
  binary: true
};
