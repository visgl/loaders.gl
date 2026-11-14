// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, ReadableFile} from '@loaders.gl/core/loader-utils';
import {ArrayBufferFile, concatenateArrayBuffersAsync} from '@loaders.gl/core/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/core/schema';
import {parseParquetFile, parseParquetFileInBatches} from './parse-parquet-to-json';
import {
  parseParquetFileToArrowInBatchesWithJs,
  parseParquetFileToArrowWithJs
} from '../../../../modules/tables/src/parquet/lib/parsers/parse-parquet-to-arrow-js';
import {normalizeParquetOptions} from '../../../../modules/tables/src/parquet/lib/utils/normalize-parquet-options';
import {ParquetJSLoader as ParquetJSLoaderMetadata} from './parquet-js-loader-types';
import type {ParquetLoaderOptions} from '../../../../modules/tables/src/parquet/parquet-loader-options';

const {preload: _ParquetJSLoaderPreload, ...ParquetJSLoaderMetadataWithoutPreload} =
  ParquetJSLoaderMetadata;

/** Default option bag for the experimental TypeScript-backed Parquet loader. */
const DEFAULT_PARQUET_JS_OPTIONS = {
  columns: undefined,
  preserveBinary: false,
  verifyFooterSignature: true,
  shape: 'arrow-table' as const
};

/** Parser-bearing TypeScript-only Parquet loader implementation. */
export const ParquetJSLoaderWithParser = {
  ...ParquetJSLoaderMetadataWithoutPreload,
  worker: false,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    const parquetOptions = getParquetOptions(options);
    const file = new ArrayBufferFile(arrayBuffer);
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
    const file = new ArrayBufferFile(arrayBuffer);
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
 * Normalizes caller options for the TypeScript-backed Parquet loader.
 * @param options caller-supplied loader options
 * @returns normalized options with TypeScript defaults applied
 */
function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(options, DEFAULT_PARQUET_JS_OPTIONS);
}
