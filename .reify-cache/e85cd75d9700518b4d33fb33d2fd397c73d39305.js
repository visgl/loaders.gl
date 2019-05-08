"use strict";var encodeGLBSync;module.link('./glb/encode-glb',{default(v){encodeGLBSync=v}},0);

module.exportDefault({
  name: 'GLB',
  extensions: ['glb'],
  encodeSync,
  binary: true
});

function encodeSync(glb, options) {
  // Calculate length and allocate buffer
  const byteLength = encodeGLBSync(glb, null, 0, options);
  const arrayBuffer = new ArrayBuffer(byteLength);

  // Encode into buffer
  const dataView = new DataView(arrayBuffer);
  encodeGLBSync(glb, dataView, 0, options);

  return arrayBuffer;
}
