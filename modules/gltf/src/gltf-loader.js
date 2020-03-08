// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */

import {parseGLTF} from './lib/parse-gltf';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const GLTFLoader = {
  id: 'gltf',
  name: 'glTF',
  version: VERSION,
  extensions: ['gltf', 'glb'],
  // mimeType: 'model/gltf-binary',
  mimeType: 'model/gltf+json',

  text: true,
  binary: true,
  test: 'glTF',
  parse,

  options: {
    gltf: {
      loadBuffers: true, // Fetch any linked .BIN buffers, decode base64
      loadImages: true, // Create image objects
      decompressMeshes: true, // Decompress Draco encoded meshes
      postProcess: true // Postprocess glTF and return json structure directly
    },

    // common?
    uri: '', // base URI
    log: console // eslint-disable-line
  }
};

export default GLTFLoader;

export async function parse(arrayBuffer, options = {}, context) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GLTFLoader.options, ...options};
  options.gltf = {...GLTFLoader.options.gltf, ...options.gltf};
  addDeprecatedGLTFOptions(options);

  const {byteOffset = 0} = options;
  const gltf = {};
  return await parseGLTF(gltf, arrayBuffer, byteOffset, options, context);
}

// DEPRECATED

function addDeprecatedGLTFOptions(options) {
  if ('fetchImages' in options) {
    options.gltf.loadImages = options.fetchImages;
  }
  if ('createImages' in options) {
    options.gltf.loadImages = options.createImages;
  }
  if ('fetchLinkedResources' in options) {
    options.gltf.fetchBuffers = options.fetchLinkedResources;
  }
  if ('decompress' in options) {
    options.gltf.decompressMeshes = options.decompress;
  }
  if ('decompress' in options.gltf) {
    options.gltf.decompressMeshes = options.gltf.decompress;
  }
  if ('postProcess' in options) {
    options.gltf.postProcess = options.postProcess;
  }
}
