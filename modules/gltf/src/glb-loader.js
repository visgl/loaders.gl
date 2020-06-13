// GLB is the binary container format for GLTF
import parseGLBSync from './lib/parse-glb';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export default {
  id: 'glb',
  name: 'GLB',
  version: VERSION,
  extensions: ['glb'],
  mimeTypes: ['model/gltf-binary'],
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
