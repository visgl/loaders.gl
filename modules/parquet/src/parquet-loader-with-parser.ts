// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  ArrowTable,
  ArrowTableBatch
  // ColumnarTable,
  // ColumnarTableBatch
} from '@loaders.gl/schema';
import {BlobFile} from '@loaders.gl/loader-utils';
import type {ReadableFile} from '@loaders.gl/loader-utils';

import {
  parseParquetArrowTable,
  parseParquetArrowTableInBatches,
  parseParquetObjectRowTable,
  parseParquetObjectRowTableInBatches
} from './lib/parsers/parse-parquet-tables';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {ParquetLoader as ParquetLoaderMetadata, type ParquetLoaderOptions} from './parquet-loader';

const {preload: _ParquetLoaderPreload, ...ParquetLoaderMetadataWithoutPreload} =
  ParquetLoaderMetadata;

export type {ParquetLoaderOptions} from './parquet-loader';

/** Parquet table loader supporting object-row and Arrow table output. */
export const ParquetLoaderWithParser = {
  ...ParquetLoaderMetadataWithoutPreload,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseParquetTable(new BlobFile(arrayBuffer), options);
  },
  parseFile(file, options?: ParquetLoaderOptions) {
    return parseParquetTable(file, options);
  },
  parseFileInBatches(file, options?: ParquetLoaderOptions) {
    return parseParquetTableInBatches(file, options);
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseParquetTableInBatches(new BlobFile(arrayBuffer), options);
  }
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

/**
 * Parses a Parquet file using the canonical wasm-backed table loader.
 * @param file readable file abstraction
 * @param options optional loader options
 * @returns object-row or Arrow table output depending on `parquet.shape`
 */
async function parseParquetTable(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable | ArrowTable> {
  const parquetOptions = getParquetOptions(options);

  if (parquetOptions.parquet?.shape === 'arrow-table') {
    return await parseParquetArrowTable(file, parquetOptions);
  }

  return await parseParquetObjectRowTable(file, parquetOptions);
}

/**
 * Parses a Parquet file into streamed table batches using the canonical wasm-backed loader.
 * @param file readable file abstraction
 * @param options optional loader options
 * @returns async iterable of object-row or Arrow batches
 */
async function* parseParquetTableInBatches(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch | ArrowTableBatch> {
  const parquetOptions = getParquetOptions(options);

  if (parquetOptions.parquet?.shape === 'arrow-table') {
    yield* parseParquetArrowTableInBatches(file, parquetOptions);
    return;
  }

  yield* parseParquetObjectRowTableInBatches(file, parquetOptions);
}

/**
 * Normalizes caller options for the canonical wasm-backed Parquet loaders.
 * @param options caller-supplied loader options
 * @returns normalized loader options
 */
export function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(
    {
      ...options,
      parquet: {
        ...(options?.parquet || {}),
        implementation: 'wasm'
      }
    },
    ParquetLoaderWithParser.options.parquet
  );
}
