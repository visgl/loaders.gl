/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import {VERSION} from './lib/utils/version';

/**
 * Worker loader for the Crunch compressed texture container format
 * @type {WorkerLoaderObject}
 */
export const CrunchWorkerLoader = {
  id: 'crunch',
  name: 'Crunch',
  module: 'textures',
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
