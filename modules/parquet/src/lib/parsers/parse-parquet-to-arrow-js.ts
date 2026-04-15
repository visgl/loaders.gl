// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, ObjectRowTable} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';

import type {ParquetLoaderOptions} from '../../parquet-loader-options';
import {parseParquetFile, parseParquetFileInBatches} from './parse-parquet-to-json';

export async function parseParquetFileToArrowWithJs(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ArrowTable> {
  const objectRowTable = await parseParquetFile(file, options);
  return {
    shape: 'arrow-table',
    schema: objectRowTable.schema,
    data: arrow.tableFromJSON(objectRowTable.data)
  };
}

export async function* parseParquetFileToArrowInBatchesWithJs(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  for await (const batch of parseParquetFileInBatches(file, options)) {
    const arrowTable = arrow.tableFromJSON((batch as ObjectRowTable).data);

    yield {
      batchType: batch.batchType,
      shape: 'arrow-table',
      schema: batch.schema,
      data: arrowTable,
      length: batch.length
    };
  }
}
