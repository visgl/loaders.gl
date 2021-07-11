import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import parsePCDSync from './lib/parse-pcd';
import {PCDLoader as PCDWorkerLoader} from './pcd-loader';

export {PCDWorkerLoader};

/**
 * Loader for PCD - Point Cloud Data
 */
export const PCDLoader = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer) => parsePCDSync(arrayBuffer),
  parseSync: parsePCDSync
};

export const _typecheckPCDLoader: LoaderWithParser = PCDLoader;
