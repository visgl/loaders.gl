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
  category: 'geometry',
  extensions: ['wkb'],
  mimeTypes: [],
  options: {
    wkb: {
      workerUrl: `https://unpkg.com/@loaders.gl/wkb@${VERSION}/dist/wkb-loader.worker.js`
    }
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
