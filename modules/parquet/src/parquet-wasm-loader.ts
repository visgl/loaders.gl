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
export const ParquetWasmWorkerLoader = {
  dataType: null as unknown as ArrowTable,
  batchType: null as never,

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
} as const satisfies Loader<ArrowTable, never, ParquetWasmLoaderOptions>;

/** Parquet WASM table loader */
export const ParquetWasmLoader = {
  ...ParquetWasmWorkerLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetWasmLoaderOptions) {
    options = {parquet: {...ParquetWasmLoader.options.parquet, ...options?.parquet}, ...options};
    return parseParquetWasm(arrayBuffer, options);
  }
} as const satisfies LoaderWithParser<ArrowTable, never, ParquetWasmLoaderOptions>;
