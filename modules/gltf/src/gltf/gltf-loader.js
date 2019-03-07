// Binary container format for glTF

import GLTFParser from './gltf-parser';

export function parseGLTF(arrayBuffer, options = {}) {
  return new GLTFParser().parse(arrayBuffer, options);
}

export function parseGLTFSync(arrayBuffer, options = {}) {
  return new GLTFParser().parseSync(arrayBuffer, options);
}

export default {
  name: 'glTF',
  extension: ['gltf', 'glb'],
  parse: parseGLTF,
  parseSync: parseGLTFSync
};
