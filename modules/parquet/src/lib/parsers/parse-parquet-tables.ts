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
import {parseParquetFileToArrow, parseParquetFileToArrowInBatches} from './parse-parquet-to-arrow';
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
  return parseParquetFileToArrow(file, options.parquet);
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
  return parseParquetFileToArrowInBatches(file, options.parquet);
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
  for await (const batch of parseParquetArrowTableInBatches(file, options)) {
    yield convertArrowBatchToObjectRows(batch);
  }
}
