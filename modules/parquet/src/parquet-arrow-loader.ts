// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {ReadableFile, BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

import {
  parseParquetFileToArrow,
  parseParquetFileToArrowInBatches
} from './lib/parsers/parse-parquet-to-arrow';
import {VERSION, PARQUET_WASM_URL} from './lib/constants';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import type {ParquetLoaderOptions} from './parquet-loader-options';

/** Parquet WASM loader options */
export type ParquetArrowLoaderOptions = ParquetLoaderOptions;

/** Parquet WASM table loader */
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
      limit: undefined, // Provide a limit to the number of rows to be read.
      offset: 0, // Provide an offset to skip over the given number of rows.
      batchSize: undefined, // The number of rows in each batch. If not provided, the upstream parquet default is 1024.
      columns: undefined, // The column names from the file to read.
      rowGroups: undefined, // Only read data from the provided row group indexes.
      concurrency: undefined, // The number of concurrent requests to make
      wasmUrl: PARQUET_WASM_URL
    }
  }
} as const satisfies Loader<ArrowTable, ArrowTableBatch, ParquetArrowLoaderOptions>;

/** Parquet WASM table loader */
export const ParquetArrowLoader = {
  ...ParquetArrowWorkerLoader,

  parse(arrayBuffer: ArrayBuffer, options?: ParquetArrowLoaderOptions) {
    return parseArrowTable(new BlobFile(arrayBuffer), getParquetOptions(options));
  },

  parseFile(file: ReadableFile, options?: ParquetArrowLoaderOptions) {
    return parseArrowTable(file, getParquetOptions(options));
  },

  parseFileInBatches(file: ReadableFile, options?: ParquetArrowLoaderOptions) {
    return parseArrowTableInBatches(file, getParquetOptions(options));
  },

  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetArrowLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseArrowTableInBatches(new BlobFile(arrayBuffer), getParquetOptions(options));
  }
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, ParquetArrowLoaderOptions>;

function getParquetOptions(options?: ParquetArrowLoaderOptions): ParquetLoaderOptions {
  const parquetOptions = normalizeParquetOptions(options, ParquetArrowLoader.options.parquet);
  const parquetOptionsWithImplementation = (parquetOptions.parquet ||
    {}) as ParquetLoaderOptions['parquet'] & {implementation?: 'wasm' | 'js'};
  const {implementation: _implementation, ...wasmParquetOptions} = parquetOptionsWithImplementation;

  return {
    ...parquetOptions,
    parquet: wasmParquetOptions
  };
}

function parseArrowTable(file: ReadableFile, options: ParquetLoaderOptions): Promise<ArrowTable> {
  return parseParquetFileToArrow(file, options.parquet);
}

function parseArrowTableInBatches(
  file: ReadableFile,
  options: ParquetLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  return parseParquetFileToArrowInBatches(file, options.parquet);
}
