import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {GLB} from './lib/types/glb-types';
import type {ParseGLBOptions} from './lib/parsers/parse-glb';
import {VERSION} from './lib/utils/version';
import {parseGLBSync} from './lib/parsers/parse-glb';

/** GLB loader options */
export type GLBLoaderOptions = LoaderOptions & {
  /** GLB Parser Options */
  glb?: ParseGLBOptions;
  /** GLB specific: byteOffset to start parsing from */
  byteOffset?: number;
};

/**
 * GLB Loader -
 * GLB is the binary container format for GLTF
 */
export const GLBLoader = {
  dataType: null as unknown as GLB,
  batchType: null as never,
  name: 'GLB',
  id: 'glb',
  module: 'gltf',
  version: VERSION,
  extensions: ['glb'],
  mimeTypes: ['model/gltf-binary'],
  binary: true,
  parse,
  parseSync,
  options: {
    glb: {
      strict: false // Enables deprecated XVIZ support (illegal CHUNK formats)
    }
  }
} as const satisfies LoaderWithParser<GLB, never, GLBLoaderOptions>;

async function parse(arrayBuffer: ArrayBuffer, options?: GLBLoaderOptions): Promise<GLB> {
  return parseSync(arrayBuffer, options);
}

function parseSync(arrayBuffer: ArrayBuffer, options?: GLBLoaderOptions): GLB {
  const {byteOffset = 0} = options || {};
  const glb: GLB = {} as GLB;
  parseGLBSync(glb, arrayBuffer, byteOffset, options?.glb);
  return glb;
}
