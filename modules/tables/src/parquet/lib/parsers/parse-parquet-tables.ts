// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/core/schema';

import type {ParquetLoaderOptions} from '../../parquet-loader-options';
import {
  parseParquetFileToArrowWithJs,
  parseParquetFileToArrowInBatchesWithJs
} from './parse-parquet-to-arrow-js';
import {convertArrowToTable} from '@loaders.gl/core/schema-utils';

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
): Promise<Table> {
  return parseParquetFileToArrowWithJs(file, options);
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
): AsyncIterable<Table> {
  return parseParquetFileToArrowInBatchesWithJs(file, options);
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
  return convertArrowToTable(arrowTable, 'object-row-table');
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
    yield convertParquetTableToRows(batch);
  }
}

/** Converts one decoded Arrow table chunk to the Parquet object-row batch contract. */
export function convertParquetTableToRows(table: Table): ObjectRowTableBatch {
  return {
    ...convertArrowToTable(table, 'object-row-table'),
    batchType: 'data',
    length: table.numRows
  };
}
