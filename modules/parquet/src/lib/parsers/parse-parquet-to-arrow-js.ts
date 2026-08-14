// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';

import type {ParquetLoaderOptions} from '../../parquet-loader-options';
import {normalizeArrowTableGeoMetadata} from '../geo/geospatial-metadata';
import {parseParquetFile, parseParquetFileInBatches} from './parse-parquet-to-json';

/**
 * Parses a Parquet file with the TypeScript implementation and converts the decoded rows to Arrow.
 * @param file readable Parquet file
 * @param options loader options applied before Arrow conversion
 * @returns Arrow table containing the decoded rows
 */
export async function parseParquetFileToArrowWithJs(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ArrowTable> {
  const objectRowTable = await parseParquetFile(file, options);
  return normalizeArrowTableGeoMetadata(convertTable(objectRowTable, 'arrow-table'));
}

/**
 * Parses a Parquet file in batches with the TypeScript implementation and converts each batch to Arrow.
 * @param file readable Parquet file
 * @param options loader options applied before Arrow conversion
 * @returns asynchronous Arrow table batches
 */
export async function* parseParquetFileToArrowInBatchesWithJs(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  for await (const batch of parseParquetFileInBatches(file, options)) {
    const arrowTable = normalizeArrowTableGeoMetadata(convertTable(batch, 'arrow-table'));

    yield {
      batchType: batch.batchType,
      shape: arrowTable.shape,
      schema: arrowTable.schema,
      data: arrowTable.data,
      length: batch.length
    };
  }
}
