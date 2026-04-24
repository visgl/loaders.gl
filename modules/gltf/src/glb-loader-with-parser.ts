import type {LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {GLB} from './lib/types/glb-types';
import type {ParseGLBOptions} from './lib/parsers/parse-glb';
import {parseGLBSync} from './lib/parsers/parse-glb';
import {GLBLoader as GLBLoaderMetadata} from './glb-loader';

const {preload: _GLBLoaderPreload, ...GLBLoaderMetadataWithoutPreload} = GLBLoaderMetadata;

/** GLB loader options */
export type GLBLoaderOptions = StrictLoaderOptions & {
  glb?: {
    /** GLB Parser Options */
    glb?: ParseGLBOptions;
    /** GLB specific: byteOffset to start parsing from */
    byteOffset?: number;
    strict?: boolean;
  };
};

/**
 * GLB Loader -
 * GLB is the binary container format for GLTF
 */
export const GLBLoaderWithParser = {
  ...GLBLoaderMetadataWithoutPreload,
  parse,
  parseSync
} as const satisfies LoaderWithParser<GLB, never, GLBLoaderOptions>;

async function parse(arrayBuffer: ArrayBuffer, options?: GLBLoaderOptions): Promise<GLB> {
  return parseSync(arrayBuffer, options);
}

function parseSync(arrayBuffer: ArrayBuffer, options?: GLBLoaderOptions): GLB {
  const glb: GLB = {} as GLB;
  parseGLBSync(glb, arrayBuffer, options?.glb?.byteOffset || 0, options?.glb);
  return glb;
}
