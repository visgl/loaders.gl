/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import {VERSION} from './lib/utils/version';
import {parseNPY} from './lib/parsers/parse-npy';

// \x93NUMPY
const NPY_MAGIC_NUMBER = new Uint8Array([147, 78, 85, 77, 80, 89]);

/**
 * Worker loader for numpy "tiles"
 * @type {WorkerLoaderObject}
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
 * @type {LoaderObject}
 */
export const NPYLoader = {
  ...NPYWorkerLoader,
  parseSync: parseNPY,
  parse: async (arrayBuffer, options) => parseNPY(arrayBuffer, options)
};
