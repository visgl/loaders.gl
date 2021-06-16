import type {WorkerLoaderObject, LoaderObject} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import parseBasis from './lib/parsers/parse-basis';

/**
 * Worker loader for Basis super compressed textures
 */
export const BasisWorkerLoader = {
  name: 'Basis',
  id: 'basis',
  module: 'textures',
  version: VERSION,
  worker: true,
  extensions: ['basis'],
  mimeTypes: ['application/octet-stream'],
  tests: ['sB'],
  binary: true,
  options: {
    basis: {
      format: 'rgb565', // TODO: auto...
      libraryPath: 'libs/'
    }
  }
};

/**
 * Loader for Basis super compressed textures
 */
export const BasisLoader = {
  ...BasisWorkerLoader,
  parse: parseBasis
};

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckBasisWorkerLoader: WorkerLoaderObject = BasisWorkerLoader;
export const _TypecheckBasisLoader: LoaderObject = BasisLoader;
