// Binary container format for glTF

import {parseGLTFSync, parseGLTF} from './lib/parse-gltf';
import GLTFParser from './lib/deprecated/gltf-parser';

export async function parse(arrayBuffer, options = {}) {
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
  extension: ['gltf', 'glb'],
  text: true,
  binary: true,
  parse,
  parseSync, // Less features when parsing synchronously
  defaultOptions: {
    useGLTFParser: true // GLTFParser will be removed in v2.
  }
};
