// loaders.gl, MIT license

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseWKB} from './lib/parse-wkb';
import {BinaryGeometry} from '@loaders.gl/schema';

export type WKBLoaderOptions = LoaderOptions;

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const WKBWorkerLoader: Loader<BinaryGeometry, never, WKBLoaderOptions> = {
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
export const WKBLoader: LoaderWithParser<BinaryGeometry, never, WKBLoaderOptions> = {
  ...WKBWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer) => parseWKB(arrayBuffer),
  parseSync: parseWKB
};
