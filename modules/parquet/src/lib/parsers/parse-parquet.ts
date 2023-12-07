// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';

import type {ParquetLoaderOptions} from '../../parquet-loader';
import type {ParquetRow} from '../../parquetjs/schema/declare';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {getSchemaFromParquetReader} from './get-parquet-schema';
import {installBufferPolyfill} from '../../polyfills/buffer';

/**
 *  * Parse a parquet file using parquetjs
 * @param file
 * @param options
 * @returns
 */
export async function parseParquetFile(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable> {
  installBufferPolyfill();

  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });

  const schema = await getSchemaFromParquetReader(reader);

  const rows: ParquetRow[] = [];

  const rowBatches = reader.rowBatchIterator(options?.parquet);
  for await (const rowBatch of rowBatches) {
    // we have only one input batch so return
    for (const row of rowBatch) {
      rows.push(row);
    }
  }
  const objectRowTable: ObjectRowTable = {
    shape: 'object-row-table',
    schema,
    data: rows
  };

  const shape = options?.parquet?.shape;
  return convertTable(objectRowTable, shape);
}

/**
 * Parse a parquet file in batches using parquetjs
 * @param file
 * @param options
 */
export async function* parseParquetFileInBatches(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch> {
  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });

  const schema = await getSchemaFromParquetReader(reader);
  const rowBatches = reader.rowBatchIterator(options?.parquet);
  for await (const rows of rowBatches) {
    const objectRowTable: ObjectRowTable = {
      shape: 'object-row-table',
      schema,
      data: rows
    };
    const shape = options?.parquet?.shape;
    const table = convertTable(objectRowTable, shape);

    yield {
      batchType: 'data',
      schema,
      ...table,
      length: rows.length
    };
  }
}

function convertTable(
  objectRowTable: ObjectRowTable,
  shape?: 'object-row-table' | 'geojson-table'
): ObjectRowTable {
  switch (shape) {
    case 'object-row-table':
      return objectRowTable;

    // Hack until geoparquet fixes up forwarded shape
    case 'geojson-table':
      return objectRowTable;

    default:
      throw new Error(shape);
  }
}
