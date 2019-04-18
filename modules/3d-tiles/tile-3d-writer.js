import encode3DTile from './encoders/encode-3d-tile';

// TODO - target writer structure not yet clear
export default {
  name: 'GLB',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  // TODO - need extension selector for save...
  encodeSync,
  binary: true
};

function encodeSync(tile, options) {
  return encode3DTile(tile, options);
}
