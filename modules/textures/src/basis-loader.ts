import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/worker-utils';
import {VERSION} from './lib/utils/version';
import parseBasis from './lib/parsers/parse-basis';

/**
 * Worker loader for Basis super compressed textures
 */
export const BasisWorkerLoader = {
  name: 'Basis',
  id: isBrowser ? 'basis' : 'basis-nodejs',
  module: 'textures',
  version: VERSION,
  worker: true,
  extensions: ['basis', 'ktx2'],
  mimeTypes: ['application/octet-stream', 'image/ktx2'],
  tests: ['sB'],
  binary: true,
  options: {
    basis: {
      format: 'auto', // gl context doesn't exist on a worker thread
      libraryPath: 'libs/',
      containerFormat: 'auto', // 'basis' || 'ktx2' || 'auto'
      module: 'transcoder' // 'transcoder' || 'encoder'
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
export const _TypecheckBasisWorkerLoader: Loader = BasisWorkerLoader;
export const _TypecheckBasisLoader: LoaderWithParser = BasisLoader;
