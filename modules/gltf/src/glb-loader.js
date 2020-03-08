// Binary container format for GLB

// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseGLBSync from './lib/parse-glb';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export default {
  id: 'glb',
  name: 'GLB',
  version: VERSION,
  extensions: ['glb'],
  mimeType: 'model/gltf-binary',
  binary: true,
  parse: async (arrayBuffer, options) => parseSync(arrayBuffer, options),
  parseSync,
  options: {
    glb: {
      strict: false // Enables deprecated XVIZ support (illegal CHUNK formats)
    }
  }
};

function parseSync(arrayBuffer, options) {
  const {byteOffset = 0} = options;
  const glb = {};
  parseGLBSync(glb, arrayBuffer, byteOffset, options);
  return glb;
}
