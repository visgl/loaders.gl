// Binary container format for glTF

import {parseGLTFSync, parseGLTF} from './lib/parse-gltf';
import GLTFParser from './lib/deprecated/gltf-parser';

const DEFAULT_OPTIONS = {
  useGLTFParser: true // GLTFParser will be removed in v2.
};

export async function parse(arrayBuffer, options = {}) {
  // Apps like to call the parse method directly so apply default options here
  options = {...DEFAULT_OPTIONS, ...options};
  // Deprecated: Return GLTFParser instance
  if (options.useGLTFParser) {
    const gltfParser = new GLTFParser();
    return gltfParser.parse(arrayBuffer, options);
  }

  // Return pure javascript object
  const {byteOffset = 0} = options;
  const gltf = {};
  await parseGLTF(gltf, arrayBuffer, byteOffset, options);
  return gltf;
}

export function parseSync(arrayBuffer, options = {}) {
  // Apps like to call the parse method directly so apply default options here
  options = {...DEFAULT_OPTIONS, ...options};

  // Deprecated: Return GLTFParser instance
  if (options.useGLTFParser) {
    return new GLTFParser().parseSync(arrayBuffer, options);
  }

  // Return pure javascript object
  const {byteOffset = 0} = options;
  const gltf = {};
  parseGLTFSync(gltf, arrayBuffer, byteOffset, options);
  return gltf;
}

export default {
  name: 'glTF',
  extensions: ['gltf', 'glb'],
  text: true,
  binary: true,
  parse,
  parseSync, // Less features when parsing synchronously
  defaultOptions: DEFAULT_OPTIONS
};
