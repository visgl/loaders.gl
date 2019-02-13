// Binary container format for glTF

import GLTFParser from './gltf-parser';

export function parseTextGLTF(json, options = {}) {
  return new GLTFParser().parse(json, options);
}

export function parseBinaryGLTF(glbArrayBuffer, options = {}) {
  return new GLTFParser().parse(glbArrayBuffer, options);
}

export default {
  name: 'glTF',
  extension: ['gltf', 'glb'],
  parseTextSync: parseTextGLTF,
  parseSync: parseBinaryGLTF
};
