import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import parsePCDSync from './lib/parse-pcd';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for PCD - Point Cloud Data
 */
export const PCDWorkerLoader: Loader = {
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
 */
export const PCDLoader: LoaderWithParser = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer) => await parsePCDSync(arrayBuffer),
  parseSync: parsePCDSync
};
