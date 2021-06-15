import type {LoaderObject} from '@loaders.gl/loader-utils';
import type {GLTFParseOptions, GLTFOptions} from './lib/parsers/parse-gltf';
import {VERSION} from './lib/utils/version';
import {parseGLTF} from './lib/parsers/parse-gltf';

/**
 * GLTF loader options
 */
export type GLTFLoaderOptions = GLTFParseOptions;

/**
 * GLTF loader
 */
export const GLTFLoader: LoaderObject = {
  name: 'glTF',
  id: 'gltf',
  module: 'gltf',
  version: VERSION,
  extensions: ['gltf', 'glb'],
  mimeTypes: ['model/gltf+json', 'model/gltf-binary'],

  text: true,
  binary: true,
  tests: ['glTF'],
  parse,

  options: {
    gltf: {
      normalize: true, // Normalize glTF v1 to glTF v2 format (not yet stable)
      loadBuffers: true, // Fetch any linked .BIN buffers, decode base64
      loadImages: true, // Create image objects
      decompressMeshes: true, // Decompress Draco encoded meshes
      postProcess: true // Postprocess glTF and return json structure directly
    },

    // common?
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

export async function parse(arrayBuffer, options: {[key: string]: any} = {}, context) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GLTFLoader.options, ...options};
  // @ts-ignore
  options.gltf = {...GLTFLoader.options.gltf, ...options.gltf};

  const {byteOffset = 0} = options;
  const gltf = {};
  return await parseGLTF(gltf, arrayBuffer, byteOffset, options as GLTFOptions, context);
}
