import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ParquetLoaderOptions = LoaderOptions & {
  parquet?: {
    type?: 'object-row-table';
    url?: string;
  };
};

const DEFAULT_PARQUET_LOADER_OPTIONS: ParquetLoaderOptions = {
  parquet: {
    type: 'object-row-table',
    url: undefined
  }
};

/** ParquetJS table loader */
export const ParquetLoader = {
  name: 'Apache Parquet',
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['PAR1', 'PARE'],
  options: DEFAULT_PARQUET_LOADER_OPTIONS
};

export const _typecheckParquetLoader: Loader = ParquetLoader;
