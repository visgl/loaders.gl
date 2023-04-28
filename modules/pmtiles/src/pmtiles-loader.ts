import type {Loader} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for PCD - Point Cloud Data
 */
export const PMTilesLoader = {
  name: 'PMTiles',
  id: 'pmtiles',
  module: 'pmtiles',
  version: VERSION,
  worker: true,
  extensions: ['pmtilse'],
  mimeTypes: ['application/octet-stream'],
  options: {
    pmtiles: {}
  }
};

export const _typecheckPCDLoader: Loader = PMTilesLoader;
