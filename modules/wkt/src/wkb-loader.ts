import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import parseWKB from './lib/parse-wkb';

export type WKBLoaderOptions = LoaderOptions;

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const WKBWorkerLoader: Loader<unknown, never, WKBLoaderOptions> = {
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
export const WKBLoader: LoaderWithParser<unknown, never, WKBLoaderOptions> = {
  ...WKBWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer) => parseWKB(arrayBuffer),
  parseSync: parseWKB
};
