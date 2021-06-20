import type {Writer} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import encodeGLBSync from './lib/encoders/encode-glb';

/**
 * GLB exporter
 * GLB is the binary container format for GLTF
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

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckGLBLoader: Writer = GLBWriter;
