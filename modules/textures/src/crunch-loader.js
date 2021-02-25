/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
// Uncomment this line when latest version will be updated to '3.0.0-alpha.5'
// import {VERSION} from './lib/utils/version';

const VERSION = '3.0.0-alpha.5';

/**
 * Worker loader for the Crunch compressed texture container format
 * @type {WorkerLoaderObject}
 */
export const CrunchWorkerLoader = {
  id: 'crunch',
  name: 'Crunch',
  module: 'crunch',
  version: VERSION,
  worker: true,
  extensions: ['crn'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  options: {
    crunch: {
      libraryPath: `libs/`
    }
  }
};

// We void bundling crunch - rare format, only offer worker loader
