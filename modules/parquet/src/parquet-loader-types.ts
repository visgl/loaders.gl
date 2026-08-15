// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';

import {PARQUET_LOADER_BASE} from './parquet-loader-base';
import type {ParquetLoaderOptions as SharedParquetLoaderOptions} from './parquet-loader-options';
import {PARQUET_WORKER_URL} from './parquet-worker-url';

/** Options for the Parquet loader. */
export type ParquetLoaderOptions = SharedParquetLoaderOptions;

/** Preloads the parser-bearing WASM Parquet loader implementation. */
async function preloadParquetLoader() {
  const {ParquetLoaderWithParser} = await import('@loaders.gl/parquet/parquet-loader');
  return ParquetLoaderWithParser;
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
