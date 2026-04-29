// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import type {Loader} from '@loaders.gl/loader-utils';

import {VERSION, PARQUET_WASM_URL} from './lib/constants';
import {PARQUET_LOADER_DEFAULT_OPTIONS, type ParquetLoaderOptions} from './parquet-loader-options';

/** Parquet WASM loader options */
export type ParquetArrowLoaderOptions = ParquetLoaderOptions;

/** Preloads the parser-bearing Parquet Arrow loader implementation. */
async function preload() {
  const {ParquetArrowLoaderWithParser} = await import('./parquet-arrow-loader-with-parser');
  return ParquetArrowLoaderWithParser;
}

/** Metadata-only Parquet WASM worker loader. */
export const ParquetArrowWorkerLoader = {
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,

  name: 'Apache Parquet',
  id: 'parquet-wasm',
  module: 'parquet',
  version: VERSION,
  worker: false,
  category: 'table',
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['PAR1', 'PARE'],
  options: {
    parquet: {
      ...PARQUET_LOADER_DEFAULT_OPTIONS,
      limit: undefined,
      offset: 0,
      batchSize: undefined,
      columns: undefined,
      rowGroups: undefined,
      concurrency: undefined,
      wasmUrl: PARQUET_WASM_URL,
      implementation: 'wasm',
      shape: 'arrow-table'
    }
  },
  preload
} as const satisfies Loader<ArrowTable, ArrowTableBatch, ParquetArrowLoaderOptions>;

/** Metadata-only Parquet WASM table loader. */
export const ParquetArrowLoader = {
  ...ParquetArrowWorkerLoader,
  preload
} as const satisfies Loader<ArrowTable, ArrowTableBatch, ParquetArrowLoaderOptions>;
