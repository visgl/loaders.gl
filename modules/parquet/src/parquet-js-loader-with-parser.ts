// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';
import type {ReadableFile} from '@loaders.gl/loader-utils';

import {parseParquetFile, parseParquetFileInBatches} from './lib/parsers/parse-parquet-to-json';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import type {
  ParquetJSLoaderOptions,
  ParquetLoaderImplementationOptions
} from './parquet-loader-options';
import {ParquetJSLoader as ParquetJSLoaderMetadata} from './parquet-js-loader';

const {preload: _ParquetJSLoaderPreload, ...ParquetJSLoaderMetadataWithoutPreload} =
  ParquetJSLoaderMetadata;

/** Default option bag for the experimental parquetjs plain-row loader. */
const DEFAULT_PARQUET_JS_OPTIONS = {
  columns: undefined,
  implementation: 'js' as const,
  preserveBinary: false
};

/** Plain-row Parquet loader backed by the experimental parquetjs implementation. */
export const ParquetJSLoaderWithParser = {
  ...ParquetJSLoaderMetadataWithoutPreload,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetJSLoaderOptions) {
    return parseParquetFile(new BlobFile(arrayBuffer), getParquetOptions(options));
  },
  parseFile(file: ReadableFile, options?: ParquetJSLoaderOptions) {
    return parseParquetFile(file, getParquetOptions(options));
  },
  parseFileInBatches(file: ReadableFile, options?: ParquetJSLoaderOptions) {
    return parseParquetFileInBatches(file, getParquetOptions(options));
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetJSLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseParquetFileInBatches(new BlobFile(arrayBuffer), getParquetOptions(options));
  }
} as const satisfies LoaderWithParser<ObjectRowTable, ObjectRowTableBatch, ParquetJSLoaderOptions>;

/**
 * Normalizes caller options for the parquetjs-backed loader.
 * @param options caller-supplied loader options
 * @returns normalized options with parquetjs defaults applied
 */
function getParquetOptions(options?: ParquetJSLoaderOptions): ParquetLoaderImplementationOptions {
  return normalizeParquetOptions(options, DEFAULT_PARQUET_JS_OPTIONS);
}
