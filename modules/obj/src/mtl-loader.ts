// loaders.gl, MIT license
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MTLMaterial, ParseMTLOptions} from './lib/parse-mtl';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type MTLLoaderOptions = LoaderOptions & {
  mtl?: ParseMTLOptions;
};

/**
 * Loader for the MTL material format
 * Parses a Wavefront .mtl file specifying materials
 */
export const MTLLoader: Loader<MTLMaterial[], never, LoaderOptions> = {
  name: 'MTL',
  id: 'mtl',
  module: 'mtl',
  version: VERSION,
  worker: true,
  extensions: ['mtl'],
  mimeTypes: ['text/plain'],
  testText: (text: string): boolean => text.includes('newmtl'),
  options: {
    mtl: {}
  }
};

export const _typecheckMTLLoader: Loader = MTLLoader;
