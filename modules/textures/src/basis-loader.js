/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import {VERSION} from './lib/utils/version';
import parseBasis from './lib/parsers/parse-basis';

/**
 * Worker loader for Basis super compressed textures
 * @type {WorkerLoaderObject}
 */
export const BasisWorkerLoader = {
  name: 'Basis',
  id: 'basis',
  module: 'textures',
  version: VERSION,
  extensions: ['basis'],
  mimeTypes: ['application/octet-stream'],
  tests: ['sB'],
  binary: true,
  options: {
    basis: {
      format: 'rgb565', // TODO: auto...
      libraryPath: `libs/`,
      workerUrl: `https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/basis-loader.worker.js`
    }
  }
};

/**
 * Loader for Basis super compressed textures
 * @type {LoaderObject}
 */
export const BasisLoader = {
  ...BasisWorkerLoader,
  parse: parseBasis
};
