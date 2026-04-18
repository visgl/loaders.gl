// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {ReadableFile, BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

import {
  parseParquetArrowTable,
  parseParquetArrowTableInBatches
} from './lib/parsers/parse-parquet-tables';
import {VERSION, PARQUET_WASM_URL} from './lib/constants';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {PARQUET_LOADER_DEFAULT_OPTIONS, type ParquetLoaderOptions} from './parquet-loader-options';

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
      ...PARQUET_LOADER_DEFAULT_OPTIONS,
      limit: undefined, // Provide a limit to the number of rows to be read.
      offset: 0, // Provide an offset to skip over the given number of rows.
      batchSize: undefined, // The number of rows in each batch. If not provided, the upstream parquet default is 1024.
      columns: undefined, // The column names from the file to read.
      rowGroups: undefined, // Only read data from the provided row group indexes.
      concurrency: undefined, // The number of concurrent requests to make
      wasmUrl: PARQUET_WASM_URL,
      implementation: 'wasm',
      shape: 'arrow-table'
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

/**
 * Normalizes caller options for the Arrow-first Parquet loader and forces the wasm backend.
 * @param options caller-supplied loader options
 * @returns normalized loader options
 */
function getParquetOptions(options?: ParquetArrowLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(
    {
      ...options,
      parquet: {
        ...(options?.parquet || {}),
        implementation: 'wasm',
        shape: 'arrow-table'
      }
    },
    ParquetArrowLoader.options.parquet
  );
}

/**
 * Parses a readable file as an Arrow-backed Parquet table.
 * @param file readable file abstraction
 * @param options normalized loader options
 * @returns Arrow-backed table
 */
function parseArrowTable(file: ReadableFile, options: ParquetLoaderOptions): Promise<ArrowTable> {
  return parseParquetArrowTable(file, options);
}

/**
 * Parses a readable file into Arrow-backed Parquet batches.
 * @param file readable file abstraction
 * @param options normalized loader options
 * @returns async iterable of Arrow-backed batches
 */
function parseArrowTableInBatches(file: ReadableFile, options: ParquetLoaderOptions) {
  return parseParquetArrowTableInBatches(file, options);
}
