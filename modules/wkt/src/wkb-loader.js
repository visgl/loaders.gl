/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {VERSION} from './lib/utils/version';
import parseWKB from './lib/parse-wkb';

/**
 * Worker loader for WKB (Well-Known Binary)
 * @type {WorkerLoaderObject}
 */
export const WKBWorkerLoader = {
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
 * @type {LoaderObject}
 */
export const WKBLoader = {
  ...WKBWorkerLoader,
  parse: async (arrayBuffer, options) => parseWKB(arrayBuffer),
  parseSync: parseWKB
};
