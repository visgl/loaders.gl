import {parseGLTF} from './lib/parse-gltf';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
const GLTFLoader = {
  id: 'gltf',
  name: 'glTF',
  version: VERSION,
  extensions: ['gltf', 'glb'],
  mimeTypes: ['model/gltf+json', 'model/gltf-binary'],

  text: true,
  binary: true,
  tests: ['glTF'],
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
  },
  deprecatedOptions: {
    fetchImages: 'gltf.loadImages',
    createImages: 'gltf.loadImages',
    decompress: 'gltf.decompressMeshes',
    postProcess: 'gltf.postProcess',
    gltf: {
      decompress: 'gltf.decompressMeshes'
    }
  }
};

export default GLTFLoader;

export async function parse(arrayBuffer, options = {}, context) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GLTFLoader.options, ...options};
  // @ts-ignore
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
