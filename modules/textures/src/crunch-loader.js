/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for the Crunch compressed texture container format
 * @type {WorkerLoaderObject}
 */
export const CrunchWorkerLoader = {
  id: 'crunch',
  name: 'Crunch',
  version: VERSION,
  extensions: ['crn'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  options: {
    crunch: {
      libraryPath: `libs/`,
      workerUrl: `https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/crunch-loader.worker.js`
    }
  }
};

// We void bundling crunch - rare format, only offer worker loader
