// Binary container format for glTF

import parseGLBSync from './glb/parser-glb';

export default {
  name: 'GLB',
  extension: ['glb'],
  text: true,
  binary: true,
  parseSync
};

function parseSync(arrayBuffer, options) {
  const glb = {};
  const byteOffset = 0;
  parseGLBSync(glb, arrayBuffer, byteOffset, options);
  return glb;
}
