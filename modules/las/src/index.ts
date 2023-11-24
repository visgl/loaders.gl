import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {LASLoaderOptions} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {LASLoader as LASWorkerLoader} from './las-loader';
import {parseLAS} from './lib/parse-las';

// LASLoader

export type {LASLoaderOptions};
export {LASWorkerLoader};

/**
 * Loader for the LAS (LASer) point cloud format
 * @note Does not support LAS v1.4
 */
export const LASLoader: LoaderWithParser<LASMesh, never, LASLoaderOptions> = {
  ...LASWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options)
};
