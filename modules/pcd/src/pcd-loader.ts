/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parsePCDSync from './lib/parse-pcd';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for PCD - Point Cloud Data
 * @type {WorkerLoaderObject}
 */
export const PCDWorkerLoader = {
  name: 'PCD (Point Cloud Data)',
  id: 'pcd',
  module: 'pcd',
  version: VERSION,
  worker: true,
  extensions: ['pcd'],
  mimeTypes: ['text/plain'],
  options: {
    pcd: {}
  }
};

/**
 * Loader for PCD - Point Cloud Data
 * @type {LoaderObject}
 */
export const PCDLoader = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer) => await parsePCDSync(arrayBuffer),
  parseSync: parsePCDSync
};
