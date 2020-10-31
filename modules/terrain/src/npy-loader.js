/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import {parseNPY} from './lib/parse-npy';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// \x93NUMPY
const NPY_MAGIC_NUMBER = new Uint8Array([147, 78, 85, 77, 80, 89]);

/** @type {WorkerLoaderObject} */
export const NPYWorkerLoader = {
  id: 'npy',
  name: 'NPY',
  version: VERSION,
  extensions: ['npy'],
  mimeTypes: [],
  tests: [NPY_MAGIC_NUMBER.buffer],
  options: {
    npy: {
      workerUrl: `https://unpkg.com/@loaders.gl/terrain@${VERSION}/dist/npy-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const NPYLoader = {
  ...NPYWorkerLoader,
  parseSync: parseNPY,
  parse: async (arrayBuffer, options) => parseNPY(arrayBuffer, options)
};
