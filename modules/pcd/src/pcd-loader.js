/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parsePCDSync from './lib/parse-pcd';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const PCDWorkerLoader = {
  id: 'pcd',
  name: 'PCD',
  version: VERSION,
  extensions: ['pcd'],
  mimeTypes: ['text/plain'],
  options: {
    pcd: {
      workerUrl: `https://unpkg.com/@loaders.gl/pcd@${VERSION}/dist/pcd-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const PCDLoader = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer, options) => await parsePCDSync(arrayBuffer, options),
  parseSync: parsePCDSync
};
