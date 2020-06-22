import parseGDAL from './lib/parse-gdal';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export const GDALWorkerLoader = {
  id: 'gdal',
  name: 'GDAL',
  category: 'geometry',
  version: VERSION,
  extensions: ['gdal'],
  mimeTypes: [],
  options: {
    gdal: {
      workerUrl: `https://unpkg.com/@loaders.gl/gdal@${VERSION}/dist/gdal-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const GDALLoader = {
  ...GDALWorkerLoader,
  parse: async (arrayBuffer, options) => parseGDAL(arrayBuffer),
  parseSync: parseGDAL
};
