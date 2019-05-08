"use strict";var parseGLBSync;module.link('./glb/parse-glb',{default(v){parseGLBSync=v}},0);// Binary container format for glTF



module.exportDefault({
  name: 'GLB',
  extension: ['glb'],
  text: true,
  binary: true,
  parseSync
});

function parseSync(arrayBuffer, options) {
  const glb = {};
  const byteOffset = 0;
  parseGLBSync(glb, arrayBuffer, byteOffset, options);
  return glb;
}
