// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/core/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';
import type {ReadableFile} from '@loaders.gl/core/loader-utils';

import {
  convertArrowBatchToObjectRows,
  convertArrowTableToObjectRows
} from './lib/parsers/convert-parquet-tables';
import {
  parseParquetFileToArrowWithJs,
  parseParquetFileToArrowInBatchesWithJs
} from './lib/parsers/parse-parquet-to-arrow-js';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {
  deserializeParquetWorkerResult,
  serializeParquetWorkerResult
} from './lib/parquet-worker-transport';
import {ParquetLoader as ParquetLoaderMetadata} from './parquet-loader-types';
import type {ParquetLoaderOptions} from './parquet-loader-options';

export type {ParquetLoaderOptions} from './parquet-loader-options';

const {preload: _ParquetLoaderPreload, ...ParquetLoaderMetadataWithoutPreload} =
  ParquetLoaderMetadata;

/** TypeScript-backed Parquet table loader supporting object-row and Arrow table output. */
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
  },
  serializeWorkerResult: serializeParquetWorkerResult,
  deserializeWorkerResult: deserializeParquetWorkerResult
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

/**
 * Parses a Parquet file using the canonical TypeScript-backed table loader.
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
    return await parseParquetFileToArrowWithJs(file, parquetOptions);
  }

  const arrowTable = await parseParquetFileToArrowWithJs(file, parquetOptions);
  return convertArrowTableToObjectRows(arrowTable);
}

/**
 * Parses a Parquet file into streamed table batches using the canonical TypeScript-backed loader.
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
    yield* parseParquetFileToArrowInBatchesWithJs(file, parquetOptions);
    return;
  }

  for await (const batch of parseParquetFileToArrowInBatchesWithJs(file, parquetOptions)) {
    yield convertArrowBatchToObjectRows(batch);
  }
}

/**
 * Normalizes caller options for the canonical TypeScript-backed Parquet loaders.
 * @param options caller-supplied loader options
 * @returns normalized loader options
 */
export function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(options, ParquetLoaderWithParser.options.parquet);
}
