import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {GLB} from './lib/types/glb-types';
import type {ParseGLBOptions} from './lib/parsers/parse-glb';
import {VERSION} from './lib/utils/version';
import {GLBFormat} from './gltf-format';

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

/** Preloads the parser-bearing GLB loader implementation. */
async function preload() {
  const {GLBLoaderWithParser} = await import('./glb-loader-with-parser');
  return GLBLoaderWithParser;
}

/** Metadata-only GLB loader for the binary glTF container format. */
export const GLBLoader = {
  dataType: null as unknown as GLB,
  batchType: null as never,
  ...GLBFormat,
  version: VERSION,
  preload,
  options: {
    glb: {
      strict: false // Enables deprecated XVIZ support (illegal CHUNK formats)
    }
  }
} as const satisfies Loader<GLB, never, GLBLoaderOptions>;
