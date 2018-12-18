import GLTFBuilder from './gltf-builder';
import {saveBinaryFile} from '@loaders.gl/core';

function encodeGLB(json, options) {
  return new GLTFBuilder().encodeAsGLB(json, options);
}

// TODO - target writer structure not yet clear
export default {
  name: 'GLB',
  extension: 'glb',
  writeToFile: saveBinaryFile,
  // TODO - encode standard format? Encode mesh to binary?
  encodeToBinary: encodeGLB
};
