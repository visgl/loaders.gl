/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parseWKB from './lib/parse-wkb';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const WKBWorkerLoader = {
  id: 'wkb',
  name: 'WKB',
  category: 'geometry',
  version: VERSION,
  extensions: ['wkb'],
  mimeTypes: [],
  options: {
    wkb: {
      workerUrl: `https://unpkg.com/@loaders.gl/wkb@${VERSION}/dist/wkb-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const WKBLoader = {
  ...WKBWorkerLoader,
  parse: async (arrayBuffer, options) => parseWKB(arrayBuffer),
  parseSync: parseWKB
};
