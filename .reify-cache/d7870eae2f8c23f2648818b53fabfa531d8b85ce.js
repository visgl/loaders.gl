"use strict";var encode3DTile;module.link('./encoders/encode-3d-tile',{default(v){encode3DTile=v}},0);

// TODO - target writer structure not yet clear
module.exportDefault({
  name: 'GLB',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  // TODO - need extension selector for save...
  encodeSync,
  binary: true
});

function encodeSync(tile, options) {
  return encode3DTile(tile, options);
}
