import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import parseWKB from './lib/parse-wkb';

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const WKBWorkerLoader: Loader = {
  name: 'WKB',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  worker: true,
  category: 'geometry',
  extensions: ['wkb'],
  mimeTypes: [],
  options: {
    wkb: {}
  }
};

/**
 * Loader for WKB (Well-Known Binary)
 */
export const WKBLoader: LoaderWithParser = {
  ...WKBWorkerLoader,
  parse: async (arrayBuffer, options) => parseWKB(arrayBuffer),
  parseSync: parseWKB
};
