/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parseDBF from './lib/parsers/parse-dbf';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const DBFWorkerLoader = {
  id: 'dbf',
  name: 'DBF',
  category: 'table',
  version: VERSION,
  extensions: ['dbf'],
  mimeTypes: ['application/x-dbf'],
  options: {
    dbf: {
      // Default to ASCII or UTF-8?
      encoding: 'utf-8',
      workerUrl: `https://unpkg.com/@loaders.gl/shapefile@${VERSION}/dist/dbf-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const DBFLoader = {
  ...DBFWorkerLoader,
  parse: async (arrayBuffer, options) => parseDBF(arrayBuffer, options),
  parseSync: parseDBF
};
