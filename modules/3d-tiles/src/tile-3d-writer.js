import encode3DTile from './lib/encoders/encode-3d-tile';

// TODO - target writer structure not yet clear
export default {
  name: '3D Tile',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeTypes: ['application/octet-stream'],
  encodeSync,
  binary: true
};

function encodeSync(tile, options) {
  return encode3DTile(tile, options);
}
