// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {ReadableFile, BlobFile} from '@loaders.gl/loader-utils';

import {
  parseParquetFileWasm,
  parseParquetFileInBatchesWasm
} from './lib/parsers/parse-parquet-wasm';
import {VERSION, PARQUET_WASM_URL} from './lib/constants';

/** Parquet WASM loader options */
export type ParquetWasmLoaderOptions = LoaderOptions & {
  parquet?: {
    shape?: 'arrow-table';
    limit?: number; // Provide a limit to the number of rows to be read.
    offset?: number; // Provide an offset to skip over the given number of rows.
    batchSize?: number; // The number of rows in each batch. If not provided, the upstream parquet default is 1024.
    columns?: string[]; // The column names from the file to read.
    rowGroups?: number[]; // Only read data from the provided row group indexes.
    concurrency?: number; // The number of concurrent requests to make
    wasmUrl?: string;
  };
};

/** Parquet WASM table loader */
export const ParquetWasmWorkerLoader = {
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
      shape: 'arrow-table',
      limit: undefined, // Provide a limit to the number of rows to be read.
      offset: 0, // Provide an offset to skip over the given number of rows.
      batchSize: undefined, // The number of rows in each batch. If not provided, the upstream parquet default is 1024.
      columns: undefined, // The column names from the file to read.
      rowGroups: undefined, // Only read data from the provided row group indexes.
      concurrency: undefined, // The number of concurrent requests to make
      wasmUrl: PARQUET_WASM_URL
    }
  }
} as const satisfies Loader<ArrowTable, ArrowTableBatch, ParquetWasmLoaderOptions>;

/** Parquet WASM table loader */
export const ParquetWasmLoader = {
  ...ParquetWasmWorkerLoader,

  parse(arrayBuffer: ArrayBuffer, options?: ParquetWasmLoaderOptions) {
    const wasmOptions = {...ParquetWasmLoader.options.parquet, ...options?.parquet};
    return parseParquetFileWasm(new BlobFile(arrayBuffer), wasmOptions);
  },

  parseFile(file: ReadableFile, options?: ParquetWasmLoaderOptions) {
    const wasmOptions = {...ParquetWasmLoader.options.parquet, ...options?.parquet};
    return parseParquetFileWasm(file, wasmOptions);
  },

  parseFileInBatches(file: ReadableFile, options?: ParquetWasmLoaderOptions) {
    const wasmOptions = {...ParquetWasmLoader.options.parquet, ...options?.parquet};
    return parseParquetFileInBatchesWasm(file, wasmOptions);
  }
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, ParquetWasmLoaderOptions>;
