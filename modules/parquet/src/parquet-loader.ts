// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';

import {PARQUET_LOADER_BASE} from './parquet-loader-base';
import type {ParquetLoaderOptions as SharedParquetLoaderOptions} from './parquet-loader-options';
import {PARQUET_WORKER_URL} from './parquet-worker-url';

/** Options for the parquet loader */
export type ParquetLoaderOptions = SharedParquetLoaderOptions;

/** Preloads the parser-bearing Parquet loader implementation selected by `parquet.backend`. */
async function preloadParquetLoader(_url: string, options?: LoaderOptions) {
  const parquetOptions = options as ParquetLoaderOptions | undefined;
  switch (getParquetBackend(parquetOptions)) {
    case 'wasm': {
      const {ParquetWASMLoaderWithParser} = await import('./parquet-wasm-loader-with-parser');
      return ParquetWASMLoaderWithParser;
    }

    case 'typescript': {
      const {ParquetLoaderWithParser} = await import('./parquet-loader-with-parser');
      return ParquetLoaderWithParser;
    }

    default:
      throw new Error(`ParquetLoader: unsupported backend "${parquetOptions?.parquet?.backend}"`);
  }
}

/** Metadata-only Parquet table loader supporting object-row and Arrow table output. */
export const ParquetLoader = {
  ...PARQUET_LOADER_BASE,
  worker: PARQUET_WORKER_URL,
  preload: preloadParquetLoader
} as const satisfies Loader<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

function getParquetBackend(options?: ParquetLoaderOptions): 'wasm' | 'typescript' {
  if (options?.parquet?.backend) {
    return options.parquet.backend;
  }
  if (options?.parquet?.implementation === 'js') {
    return 'typescript';
  }
  return ParquetLoader.options.parquet.backend;
}
