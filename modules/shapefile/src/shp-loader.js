import parseSHP from './lib/parse-shp';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export const SHPWorkerLoader = {
  id: 'shp',
  name: 'SHP',
  category: 'geometry',
  version: VERSION,
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  options: {
    shp: {
      // workerUrl: `https://unpkg.com/@loaders.gl/shapefile@${VERSION}/dist/shp-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const SHPLoader = {
  ...SHPWorkerLoader,
  parse: async (arrayBuffer, options) => parseSHP(arrayBuffer),
  parseSync: parseSHP
};
