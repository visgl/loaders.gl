/* global TextDecoder */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parseWKT from './lib/parse-wkt';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const WKTWorkerLoader = {
  id: 'wkt',
  name: 'WKT',
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

/** @type {LoaderObject} */
export const WKTLoader = {
  ...WKTWorkerLoader,
  parse: async (arrayBuffer, options) => parseWKT(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseWKT
};
