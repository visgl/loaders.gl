// Binary container format for glTF

import GLBParser from '../glb/glb-parser';
import GLTFParser from './gltf-parser';

export function parseTextGLTF(json, options = {}) {
  return new GLTFParser(json).parse(options);
}

export function parseBinaryGLTF(glbArrayBuffer, options = {}) {
  const {json, arrayBuffer} = new GLBParser(glbArrayBuffer).parse(options);
  return new GLTFParser(json, arrayBuffer).parse(options);
}

export default {
  name: 'glTF',
  extension: ['gltf', 'glb'],
  parseText: parseTextGLTF,
  parseBinary: parseBinaryGLTF
};
