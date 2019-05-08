"use strict";var parse3DTileSync;module.link('./parsers/parse-3d-tile',{default(v){parse3DTileSync=v}},0);

// Tile3DLoader
module.exportDefault({
  name: '3D Tiles',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  parseSync,
  binary: true
});

function parseSync(arrayBuffer, options, url, loader) {
  const byteOffset = 0;
  return parse3DTileSync(arrayBuffer, byteOffset, options);
}
