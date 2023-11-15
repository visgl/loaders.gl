// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {ColumnarTable, ColumnarTableBatch, Schema} from '@loaders.gl/schema';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../../parquet-loader';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {ParquetRowGroup} from '../../parquetjs/schema/declare';
import {ParquetSchema} from '../../parquetjs/schema/schema';
import {materializeColumns} from '../../parquetjs/schema/shred';
import {getSchemaFromParquetReader} from './get-parquet-schema';
import {installBufferPolyfill} from '../../polyfills/buffer';

export async function parseParquetFileInColumns(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ColumnarTable> {
  installBufferPolyfill();
  for await (const batch of parseParquetFileInColumnarBatches(file, options)) {
    return {
      shape: 'columnar-table',
      schema: batch.schema,
      data: batch.data
    };
  }
  throw new Error('empty table');
}

export async function* parseParquetFileInColumnarBatches(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ColumnarTableBatch> {
  const reader = new ParquetReader(file);

  // Extract schema and geo metadata
  const schema = await getSchemaFromParquetReader(reader);

  const parquetSchema = await reader.getSchema();

  // Iterate over row batches
  const rowGroups = reader.rowGroupIterator(options?.parquet);
  for await (const rowGroup of rowGroups) {
    yield convertRowGroupToTableBatch(rowGroup, parquetSchema, schema);
  }
}

function convertRowGroupToTableBatch(
  rowGroup: ParquetRowGroup,
  parquetSchema: ParquetSchema,
  schema: Schema
): ColumnarTableBatch {
  // const data = convertParquetRowGroupToColumns(schema, rowGroup);
  const data = materializeColumns(parquetSchema, rowGroup);
  return {
    shape: 'columnar-table',
    batchType: 'data',
    schema,
    data,
    length: rowGroup.rowCount
  };
}
