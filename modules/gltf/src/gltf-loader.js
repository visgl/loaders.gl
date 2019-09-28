// Binary container format for glTF

import {parseGLTF} from './lib/parse-gltf';
import GLTFParser from './lib/deprecated/gltf-parser';

const GLTFLoader = {
  name: 'glTF',
  extensions: ['gltf', 'glb'],
  // mimeType: 'model/gltf-binary',
  mimeType: 'model/gltf+json',

  text: true,
  binary: true,
  test: 'glTF',
  parse,

  options: {
    gltf: {
      parserVersion: 1, // the new parser that will be the only option in V2 is not default in V1

      // Note: The following options are used only when parserVersion === 2
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

  // Deprecated v1 Parser: Returns `GLTFParser` instance, instead of "pure" js object
  if (options.gltf.parserVersion !== 2 && options.useGLTFParser !== false) {
    const gltfParser = new GLTFParser();
    return gltfParser.parse(arrayBuffer, options);
  }

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
