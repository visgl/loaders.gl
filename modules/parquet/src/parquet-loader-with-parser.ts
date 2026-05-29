// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';
import type {ReadableFile} from '@loaders.gl/loader-utils';

import {parseParquetFile, parseParquetFileInBatches} from './lib/parsers/parse-parquet-to-json';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import type {
  ParquetLoaderImplementationOptions,
  ParquetLoaderOptions
} from './parquet-loader-options';
import {ParquetLoader as ParquetLoaderMetadata} from './parquet-loader';

const {preload: _ParquetLoaderPreload, ...ParquetLoaderMetadataWithoutPreload} =
  ParquetLoaderMetadata;

/** Default option bag for the experimental parquetjs plain-row loader. */
const DEFAULT_PARQUET_JS_OPTIONS = {
  backend: 'typescript' as const,
  columns: undefined,
  preserveBinary: false
};

/** Parser-bearing TypeScript-only Parquet loader implementation. */
export const ParquetLoaderWithParser = {
  ...ParquetLoaderMetadataWithoutPreload,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseParquetFile(new BlobFile(arrayBuffer), getParquetOptions(options));
  },
  parseFile(file: ReadableFile, options?: ParquetLoaderOptions) {
    return parseParquetFile(file, getParquetOptions(options));
  },
  parseFileInBatches(file: ReadableFile, options?: ParquetLoaderOptions) {
    return parseParquetFileInBatches(file, getParquetOptions(options));
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseParquetFileInBatches(new BlobFile(arrayBuffer), getParquetOptions(options));
  }
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

/**
 * Normalizes caller options for the parquetjs-backed loader.
 * @param options caller-supplied loader options
 * @returns normalized options with parquetjs defaults applied
 */
function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderImplementationOptions {
  return normalizeParquetOptions(options, DEFAULT_PARQUET_JS_OPTIONS);
}
