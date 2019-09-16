// Binary container format for GLB

import parseGLBSync from './lib/parse-glb';

export default {
  name: 'GLB',
  extensions: ['glb'],
  mimeType: 'model/gltf-binary',
  binary: true,
  parse: async (arrayBuffer, options) => parseSync(arrayBuffer, options),
  parseSync,
  defaultOptions: {
    strict: false // Enables deprecated XVIZ support (illegal CHUNK formats)
  }
};

function parseSync(arrayBuffer, options) {
  const {byteOffset = 0} = options;
  const glb = {};
  parseGLBSync(glb, arrayBuffer, byteOffset, options);
  return glb;
}
