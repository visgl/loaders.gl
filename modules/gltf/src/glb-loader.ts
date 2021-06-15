import type {LoaderObject} from '@loaders.gl/loader-utils';
import type {GLB, GLBParseOptions} from './lib/parsers/parse-glb';
import {VERSION} from './lib/utils/version';
import parseGLBSync from './lib/parsers/parse-glb';

export type GLBLoaderOptions = GLBParseOptions;

/**
 * GLB Loader -
 * GLB is the binary container format for GLTF
 */
export const GLBLoader: LoaderObject = {
  name: 'GLB',
  id: 'glb',
  module: 'gltf',
  version: VERSION,
  extensions: ['glb'],
  mimeTypes: ['model/gltf-binary'],
  binary: true,
  parse: async (arrayBuffer, options) => parseSync(arrayBuffer, options),
  parseSync,
  options: {
    glb: {
      strict: false // Enables deprecated XVIZ support (illegal CHUNK formats)
    }
  }
};

function parseSync(arrayBuffer: ArrayBuffer, options): GLB {
  const {byteOffset = 0} = options;
  const glb: GLB = {} as GLB;
  parseGLBSync(glb, arrayBuffer, byteOffset, options);
  return glb;
}
