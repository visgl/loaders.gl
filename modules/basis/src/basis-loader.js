/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parseBasis from './lib/parse-basis';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const BasisWorkerLoader = {
  id: 'basis',
  name: 'Basis',
  version: VERSION,
  extensions: ['basis'],
  mimeTypes: ['application/octet-stream'],
  test: 'sB',
  binary: true,
  options: {
    basis: {
      format: 'rgb565', // TODO: auto...
      libraryPath: `libs/`,
      workerUrl: `https://unpkg.com/@loaders.gl/basis@${VERSION}/dist/basis-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const BasisLoader = {
  ...BasisWorkerLoader,
  parse: parseBasis
};
