// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/arrow';

import {parseParquetWasm} from './lib/wasm/parse-parquet-wasm';
import {VERSION, PARQUET_WASM_URL} from './lib/constants';

/** Parquet WASM loader options */
export type ParquetWasmLoaderOptions = LoaderOptions & {
  parquet?: {
    type?: 'arrow-table';
    wasmUrl?: string;
  };
};

/** Parquet WASM table loader */
export const ParquetWasmWorkerLoader: Loader<ArrowTable, never, ParquetWasmLoaderOptions> = {
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
      type: 'arrow-table',
      wasmUrl: PARQUET_WASM_URL
    }
  }
};

/** Parquet WASM table loader */
export const ParquetWasmLoader: LoaderWithParser<ArrowTable, never, ParquetWasmLoaderOptions> = {
  ...ParquetWasmWorkerLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetWasmLoaderOptions) {
    options = {parquet: {...ParquetWasmLoader.options.parquet, ...options?.parquet}, ...options};
    return parseParquetWasm(arrayBuffer, options);
  }
};
