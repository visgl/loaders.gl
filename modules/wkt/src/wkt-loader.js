/* global TextDecoder */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {VERSION} from './lib/utils/version';
import parseWKT from './lib/parse-wkt';

/**
 * @type {WorkerLoaderObject}
 */
export const WKTWorkerLoader = {
  name: 'WKT (Well-Known Text)',
  id: 'wkt',
  module: 'wkt',
  version: VERSION,
  extensions: ['wkt'],
  mimeTypes: ['text/plain'],
  category: 'geometry',
  text: true,
  options: {
    wkt: {
      workerUrl: `https://unpkg.com/@loaders.gl/wkt@${VERSION}/dist/wkt-loader.worker.js`
    }
  }
};

/**
 * @type {LoaderObject}
 */
export const WKTLoader = {
  ...WKTWorkerLoader,
  parse: async (arrayBuffer, options) => parseWKT(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseWKT
};
