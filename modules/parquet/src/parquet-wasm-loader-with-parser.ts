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
  convertArrowBatchToObjectRows,
  convertArrowTableToObjectRows
} from './lib/parsers/convert-parquet-tables';
import {
  parseParquetFileToArrow,
  parseParquetFileToArrowInBatches
} from './lib/parsers/parse-parquet-to-arrow';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {
  deserializeParquetWorkerResult,
  serializeParquetWorkerResult
} from './lib/parquet-worker-transport';
import {PARQUET_LOADER_BASE} from './parquet-loader-base';
import type {ParquetLoaderOptions} from './parquet-loader-options';
import {PARQUET_WORKER_URL} from './parquet-worker-url';

export type {ParquetLoaderOptions} from './parquet-loader-options';

/** WASM-backed Parquet table loader supporting object-row and Arrow table output. */
export const ParquetWASMLoaderWithParser = {
  ...PARQUET_LOADER_BASE,
  worker: PARQUET_WORKER_URL,
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
    return await parseParquetFileToArrow(file, parquetOptions.parquet);
  }

  const arrowTable = await parseParquetFileToArrow(file, parquetOptions.parquet);
  return convertArrowTableToObjectRows(arrowTable);
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
    yield* parseParquetFileToArrowInBatches(file, parquetOptions.parquet);
    return;
  }

  for await (const batch of parseParquetFileToArrowInBatches(file, parquetOptions.parquet)) {
    yield convertArrowBatchToObjectRows(batch);
  }
}

/**
 * Normalizes caller options for the canonical wasm-backed Parquet loaders.
 * @param options caller-supplied loader options
 * @returns normalized loader options
 */
export function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(options, ParquetWASMLoaderWithParser.options.parquet);
}
