import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseNPY} from './lib/parsers/parse-npy';

// \x93NUMPY
const NPY_MAGIC_NUMBER = new Uint8Array([147, 78, 85, 77, 80, 89]);

/**
 * Worker loader for numpy "tiles"
 */
export const NPYWorkerLoader = {
  name: 'NPY',
  id: 'npy',
  module: 'textures',
  version: VERSION,
  worker: true,
  extensions: ['npy'],
  mimeTypes: [],
  tests: [NPY_MAGIC_NUMBER.buffer],
  options: {
    npy: {}
  }
};

/**
 * Loader for numpy "tiles"
 */
export const NPYLoader = {
  ...NPYWorkerLoader,
  parseSync: parseNPY,
  parse: async (arrayBuffer, options) => parseNPY(arrayBuffer, options)
};

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckNPYWorkerLoader: Loader = NPYWorkerLoader;
export const _TypecheckNPYLoader: LoaderWithParser = NPYLoader;
