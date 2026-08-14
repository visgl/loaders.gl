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
import {
  parseParquetFileToArrowInBatchesWithJs,
  parseParquetFileToArrowWithJs
} from './lib/parsers/parse-parquet-to-arrow-js';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import type {
  ParquetLoaderImplementationOptions,
  ParquetLoaderOptions
} from './parquet-loader-options';
import {PARQUET_LOADER_BASE} from './parquet-loader-base';

/** Default option bag for the experimental parquetjs plain-row loader. */
const DEFAULT_PARQUET_JS_OPTIONS = {
  backend: 'typescript' as const,
  columns: undefined,
  preserveBinary: false
};

/** Parser-bearing TypeScript-only Parquet loader implementation. */
export const ParquetLoaderWithParser = {
  ...PARQUET_LOADER_BASE,
  worker: false,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    const parquetOptions = getParquetOptions(options);
    const file = new BlobFile(arrayBuffer);
    return parquetOptions.parquet?.shape === 'arrow-table'
      ? parseParquetFileToArrowWithJs(file, parquetOptions)
      : parseParquetFile(file, parquetOptions);
  },
  parseFile(file: ReadableFile, options?: ParquetLoaderOptions) {
    const parquetOptions = getParquetOptions(options);
    return parquetOptions.parquet?.shape === 'arrow-table'
      ? parseParquetFileToArrowWithJs(file, parquetOptions)
      : parseParquetFile(file, parquetOptions);
  },
  parseFileInBatches(file: ReadableFile, options?: ParquetLoaderOptions) {
    const parquetOptions = getParquetOptions(options);
    return parquetOptions.parquet?.shape === 'arrow-table'
      ? parseParquetFileToArrowInBatchesWithJs(file, parquetOptions)
      : parseParquetFileInBatches(file, parquetOptions);
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    const parquetOptions = getParquetOptions(options);
    const file = new BlobFile(arrayBuffer);
    if (parquetOptions.parquet?.shape === 'arrow-table') {
      yield* parseParquetFileToArrowInBatchesWithJs(file, parquetOptions);
    } else {
      yield* parseParquetFileInBatches(file, parquetOptions);
    }
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
