// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';
import type {ReadableFile} from '@loaders.gl/loader-utils';

import {parseParquetFile, parseParquetFileInBatches} from './lib/parsers/parse-parquet-to-json';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {ParquetFormat} from './parquet-format';
import type {
  ParquetJSLoaderOptions,
  ParquetLoaderImplementationOptions
} from './parquet-loader-options';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Default option bag for the experimental parquetjs plain-row loader. */
const DEFAULT_PARQUET_JS_OPTIONS = {
  columns: undefined,
  implementation: 'js' as const,
  preserveBinary: false
};

/** Plain-row Parquet loader backed by the experimental parquetjs implementation. */
export const ParquetJSLoader = {
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable,
  batchType: null as unknown as ObjectRowTableBatch,

  id: 'parquet-js',
  module: 'parquet',
  version: VERSION,
  worker: false,
  options: {
    parquet: DEFAULT_PARQUET_JS_OPTIONS
  },

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
