// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';

import type {ParquetLoaderOptions} from '../../parquet-loader-options';
import {parseParquetFile, parseParquetFileInBatches} from './parse-parquet-to-json';

export async function parseParquetFileToArrowWithJs(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ArrowTable> {
  const objectRowTable = await parseParquetFile(file, options);
  return convertTable(objectRowTable, 'arrow-table');
}

export async function* parseParquetFileToArrowInBatchesWithJs(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  for await (const batch of parseParquetFileInBatches(file, options)) {
    const arrowTable = convertTable(batch, 'arrow-table');

    yield {
      batchType: batch.batchType,
      shape: arrowTable.shape,
      schema: arrowTable.schema,
      data: arrowTable.data,
      length: batch.length
    };
  }
}
