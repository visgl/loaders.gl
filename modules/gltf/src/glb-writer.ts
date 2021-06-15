/** @typedef {import('@loaders.gl/loader-utils').WriterObject} WriterObject */
import {VERSION} from './lib/utils/version';
import encodeGLBSync from './lib/encoders/encode-glb';

/**
 * GLB exporter
 * GLB is the binary container format for GLTF
 * @type {WriterObject}
 */
export const GLBWriter = {
  name: 'GLB',
  id: 'glb',
  module: 'gltf',
  version: VERSION,

  extensions: ['glb'],
  mimeTypes: ['model/gltf-binary'],
  binary: true,

  encodeSync,

  options: {
    glb: {}
  }
};

function encodeSync(glb, options) {
  const {byteOffset = 0} = options;

  // Calculate length and allocate buffer
  const byteLength = encodeGLBSync(glb, null, byteOffset, options);
  const arrayBuffer = new ArrayBuffer(byteLength);

  // Encode into buffer
  const dataView = new DataView(arrayBuffer);
  encodeGLBSync(glb, dataView, byteOffset, options);

  return arrayBuffer;
}
