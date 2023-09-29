// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {PMTilesMetadata} from './lib/parse-pmtiles';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type PMTilesLoaderOptions = LoaderOptions & {
  pmtiles?: {};
};

/**
 * Worker loader for pmtiles metadata
 * @note loads metadata only. To load individual files, use PMTilesSource
 */
export const PMTilesLoader: LoaderWithParser<PMTilesMetadata, never, PMTilesLoaderOptions> = {
  name: 'PMTiles',
  id: 'pmtiles',
  module: 'pmtiles',
  version: VERSION,
  worker: true,
  extensions: ['pmtilse'],
  mimeTypes: ['application/octet-stream'],
  options: {
    pmtiles: {}
  },
  parse: async (arrayBuffer, options) => {
    throw new Error('not implemented');
  }
};
