import parse3DTileSync from './parsers/parse-3d-tile';

// Tile3DLoader
export default {
  name: '3D Tiles',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  parseSync,
  binary: true
};

function parseSync(arrayBuffer, options, url, loader) {
  const byteOffset = 0;
  return parse3DTileSync(arrayBuffer, byteOffset, options);
}
