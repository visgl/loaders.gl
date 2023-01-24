import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {LASLoaderOptions} from './las-loader';
import {LASLoader as LASWorkerLoader} from './las-loader';
import {parseLAS} from './lib/parse-las';

// LASLoader

export type {LASLoaderOptions};
export {LASWorkerLoader};

type PromiseType<T> = T extends Promise<infer Return> ? Return : T;
type Type = PromiseType<ReturnType<typeof parseLAS>>;

/**
 * Loader for the LAS (LASer) point cloud format
 */
export const LASLoader: LoaderWithParser<Type, never, LASLoaderOptions> = {
  ...LASWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options)
};
