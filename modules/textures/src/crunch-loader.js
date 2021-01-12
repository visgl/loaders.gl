/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */

// eslint-disable-next-line import/no-unresolved
import {parseCrunch} from './lib/parsers/parse-crunch';
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const CrunchWorkerLoader = {
  id: 'basis',
  name: 'Crunch',
  version: VERSION,
  extensions: ['crn'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  options: {
    basis: {
      libraryPath: `libs/`
      // workerUrl: `https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/crunch-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const CrunchLoader = {
  ...CrunchWorkerLoader,
  parse: parseCrunch
};
