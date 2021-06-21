import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import parseWKT from './lib/parse-wkt';

/**
 * Well-Known text loader
 */
export const WKTWorkerLoader: Loader = {
  name: 'WKT (Well-Known Text)',
  id: 'wkt',
  module: 'wkt',
  version: VERSION,
  worker: true,
  extensions: ['wkt'],
  mimeTypes: ['text/plain'],
  category: 'geometry',
  text: true,
  options: {
    wkt: {}
  }
};

/**
 * Well-Known text loader
 */
export const WKTLoader: LoaderWithParser = {
  ...WKTWorkerLoader,
  parse: async (arrayBuffer, options?) => parseWKT(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseWKT
};
