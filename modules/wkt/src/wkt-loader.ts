// loaders.gl, MIT license

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseWKT} from './lib/parse-wkt';
import {Geometry} from '@loaders.gl/schema';

export type WKTLoaderOptions = LoaderOptions;

/**
 * Well-Known text loader
 */
export const WKTWorkerLoader: Loader<Geometry, never, WKTLoaderOptions> = {
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
export const WKTLoader: LoaderWithParser<Geometry, never, WKTLoaderOptions> = {
  ...WKTWorkerLoader,
  parse: async (arrayBuffer) => parseWKT(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseWKT
};
