// Binary container format for glTF

import {parseGLTFSync, parseGLTF} from './lib/parse-gltf';
import GLTFParser from './lib/deprecated/gltf-parser';

const defaultOptions = {
  gltf: {
    parserVersion: 1 // the new parser that will be the only option in V2.
  },
  uri: '' // base URI
};

export default {
  name: 'glTF',
  extensions: ['gltf', 'glb'],
  // mimeType: 'model/gltf-binary',
  mimeType: 'model/gltf+json',
  text: true,
  binary: true,
  test: 'glTF',
  parse,
  parseSync, // Less features when parsing synchronously
  defaultOptions
};

export async function parse(arrayBuffer, options = {}) {
  // Apps like to call the parse method directly so apply default options here
  options = {...defaultOptions, ...options};
  // Deprecated: Return GLTFParser instance
  if (options.gltf.parserVersion !== 2 && options.useGLTFParser !== false) {
    const gltfParser = new GLTFParser();
    return gltfParser.parse(arrayBuffer, options);
  }

  // Return pure javascript object
  const {byteOffset = 0} = options;
  const gltf = {};
  return await parseGLTF(gltf, arrayBuffer, byteOffset, options);
}

export function parseSync(arrayBuffer, options = {}) {
  // Apps like to call the parse method directly so apply default options here
  options = {...defaultOptions, ...options};

  // Deprecated: Return GLTFParser instance
  if (options.gltf.parserVersion !== 2 && options.useGLTFParser !== false) {
    return new GLTFParser().parseSync(arrayBuffer, options);
  }

  // Return pure javascript object
  const {byteOffset = 0} = options;
  const gltf = {};
  return parseGLTFSync(gltf, arrayBuffer, byteOffset, options);
}
