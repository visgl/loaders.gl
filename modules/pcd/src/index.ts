import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import parsePCDSync from './lib/parse-pcd';
import {PCDLoader as PCDWorkerLoader} from './pcd-loader';
import {PCDMesh} from './lib/pcd-types';

export {PCDWorkerLoader};

/**
 * Loader for PCD - Point Cloud Data
 */
export const PCDLoader: LoaderWithParser<PCDMesh, never, LoaderOptions> = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer) => parsePCDSync(arrayBuffer),
  parseSync: parsePCDSync
};
