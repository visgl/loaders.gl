// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import {convertArrowToTable} from '@loaders.gl/schema-utils';
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
  switch (options.parquet?.implementation) {
    case 'js':
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
  switch (options.parquet?.implementation) {
    case 'js':
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
  if (options.parquet?.implementation === 'js') {
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
  if (options.parquet?.implementation === 'js') {
    yield* parseParquetFileInBatches(file, options);
    return;
  }

  for await (const batch of parseParquetArrowTableInBatches(file, options)) {
    yield convertArrowBatchToObjectRows(batch);
  }
}

/**
 * Converts an Arrow-backed table into object rows.
 *
 * @param arrowTable - Arrow table wrapper.
 * @returns Object-row table.
 */
export function convertArrowTableToObjectRows(arrowTable: ArrowTable): ObjectRowTable {
  return convertArrowToTable(arrowTable.data, 'object-row-table') as ObjectRowTable;
}

/**
 * Converts an Arrow batch into object-row output.
 *
 * @param batch - Arrow table batch wrapper.
 * @returns Object-row batch.
 */
export function convertArrowBatchToObjectRows(batch: ArrowTableBatch): ObjectRowTableBatch {
  const objectRowTable = convertArrowToTable(batch.data, 'object-row-table') as ObjectRowTable;

  return {
    batchType: batch.batchType,
    shape: objectRowTable.shape,
    schema: objectRowTable.schema,
    data: objectRowTable.data,
    length: batch.length
  };
}
