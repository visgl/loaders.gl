// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';

import type {ParquetLoaderOptions} from '../../parquet-loader-options';
import {parseParquetFile, parseParquetFileInBatches} from './parse-parquet-to-json';
import {parseParquetFileToArrow, parseParquetFileToArrowInBatches} from './parse-parquet-to-arrow';
import {
  parseParquetFileToArrowWithJs,
  parseParquetFileToArrowInBatchesWithJs
} from './parse-parquet-to-arrow-js';
import {
  convertArrowBatchToObjectRows,
  convertArrowTableToObjectRows
} from './convert-parquet-tables';

export {
  convertArrowBatchToObjectRows,
  convertArrowTableToObjectRows
} from './convert-parquet-tables';

/**
 * Parses a parquet file into an Arrow-backed table.
 *
 * @param file - Parquet file abstraction.
 * @param options - Normalized parquet options.
 * @returns Arrow table output.
 */
export function parseParquetArrowTable(
  file: ReadableFile,
  options: ParquetLoaderOptions
): Promise<ArrowTable> {
  switch (getParquetBackend(options)) {
    case 'typescript':
      return parseParquetFileToArrowWithJs(file, options);

    case 'wasm':
    default:
      return parseParquetFileToArrow(file, options.parquet);
  }
}

/**
 * Parses a parquet file into Arrow-backed table batches.
 *
 * @param file - Parquet file abstraction.
 * @param options - Normalized parquet options.
 * @returns Async iterable of Arrow table batches.
 */
export function parseParquetArrowTableInBatches(
  file: ReadableFile,
  options: ParquetLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  switch (getParquetBackend(options)) {
    case 'typescript':
      return parseParquetFileToArrowInBatchesWithJs(file, options);

    case 'wasm':
    default:
      return parseParquetFileToArrowInBatches(file, options.parquet);
  }
}

/**
 * Parses a parquet file into plain object rows.
 *
 * @param file - Parquet file abstraction.
 * @param options - Normalized parquet options.
 * @returns Object-row table output.
 */
export async function parseParquetObjectRowTable(
  file: ReadableFile,
  options: ParquetLoaderOptions
): Promise<ObjectRowTable> {
  if (getParquetBackend(options) === 'typescript') {
    return await parseParquetFile(file, options);
  }

  const arrowTable = await parseParquetArrowTable(file, options);
  return convertArrowTableToObjectRows(arrowTable);
}

/**
 * Parses a parquet file into object-row batches.
 *
 * @param file - Parquet file abstraction.
 * @param options - Normalized parquet options.
 * @returns Async iterable of object-row table batches.
 */
export async function* parseParquetObjectRowTableInBatches(
  file: ReadableFile,
  options: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch> {
  if (getParquetBackend(options) === 'typescript') {
    yield* parseParquetFileInBatches(file, options);
    return;
  }

  for await (const batch of parseParquetArrowTableInBatches(file, options)) {
    yield convertArrowBatchToObjectRows(batch);
  }
}

function getParquetBackend(options: ParquetLoaderOptions): 'wasm' | 'typescript' {
  if (options.parquet?.backend) {
    return options.parquet.backend;
  }
  return options.parquet?.implementation === 'js' ? 'typescript' : 'wasm';
}
