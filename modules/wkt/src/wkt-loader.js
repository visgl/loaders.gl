/* global TextDecoder */
import parseWKT from './lib/parse-wkt';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export const WKTWorkerLoader = {
  id: 'wkt',
  name: 'WKT',
  version: VERSION,
  extensions: ['wkt'],
  mimeTypes: ['text/plain'],
  category: 'geometry',
  testText: null,
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
