import type {Loader} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';

/**
 * Worker loader for the Crunch compressed texture container format
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
      libraryPath: 'libs/'
    }
  }
};

// We avoid bundling crunch - rare format, only offer worker loader

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckCrunchWorkerLoader: Loader = CrunchWorkerLoader;
