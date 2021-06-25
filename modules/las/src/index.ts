import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {LASLoader as LASWorkerLoader} from './las-loader';
import parseLAS from './lib/parse-las';

// LASLoader

export type LASLoaderOptions = LoaderOptions & {
  las?: {
    fp64?: boolean;
    skip?: number;
    colorDepth?: number;
  };
};

export {LASWorkerLoader};

/**
 * Loader for the LAS (LASer) point cloud format
 */
export const LASLoader = {
  ...LASWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options),
  parseSync: parseLAS
};

export const _typecheckLASWorkerLoader: Loader = LASWorkerLoader;
export const _typecheckLASLoader: LoaderWithParser = LASLoader;
