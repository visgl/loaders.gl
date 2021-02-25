/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import {parseSHP, parseSHPInBatches} from './lib/parsers/parse-shp';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const SHP_MAGIC_NUMBER = [0x00, 0x00, 0x27, 0x0a];

/**
 * @type {WorkerLoaderObject} */
export const SHPWorkerLoader = {
  name: 'SHP',
  id: 'shp',
  module: 'shapefile',
  version: VERSION,
  worker: true,
  category: 'geometry',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  // ISSUE: This also identifies SHX files, which are identical to SHP for the first 100 bytes...
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  options: {
    shp: {
      _maxDimensions: 4
    }
  }
};

/** @type {LoaderObject} */
export const SHPLoader = {
  ...SHPWorkerLoader,
  parse: async (arrayBuffer, options) => parseSHP(arrayBuffer, options),
  parseSync: parseSHP,
  parseInBatches: parseSHPInBatches
};
