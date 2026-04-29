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
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {type ParquetLoaderOptions} from './parquet-loader-options';
import {ParquetArrowWorkerLoader as ParquetArrowWorkerLoaderMetadata} from './parquet-arrow-loader';
import {ParquetArrowLoader as ParquetArrowLoaderMetadata} from './parquet-arrow-loader';

const {
  preload: _ParquetArrowWorkerLoaderPreload,
  ...ParquetArrowWorkerLoaderMetadataWithoutPreload
} = ParquetArrowWorkerLoaderMetadata;
const {preload: _ParquetArrowLoaderPreload, ...ParquetArrowLoaderMetadataWithoutPreload} =
  ParquetArrowLoaderMetadata;

/** Parquet WASM loader options */
export type ParquetArrowLoaderOptions = ParquetLoaderOptions;

/** Parquet WASM table loader */
export const ParquetArrowWorkerLoaderWithParser = {
  ...ParquetArrowWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<ArrowTable, ArrowTableBatch, ParquetArrowLoaderOptions>;

/** Parquet WASM table loader */
export const ParquetArrowLoaderWithParser = {
  ...ParquetArrowLoaderMetadataWithoutPreload,
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
    ParquetArrowLoaderWithParser.options.parquet
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
