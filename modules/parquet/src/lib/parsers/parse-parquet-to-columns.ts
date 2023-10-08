// loaders.gl, MIT license

import {ColumnarTable, ColumnarTableBatch, Schema} from '@loaders.gl/schema';
import {BlobFile} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../../parquet-loader';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {ParquetRowGroup} from '../../parquetjs/schema/declare';
import {ParquetSchema} from '../../parquetjs/schema/schema';
import {materializeColumns} from '../../parquetjs/schema/shred';
import {getSchemaFromParquetReader} from './get-parquet-schema';
import {installBufferPolyfill} from '../../buffer-polyfill';

export async function parseParquetInColumns(
  arrayBuffer: ArrayBuffer,
  options?: ParquetLoaderOptions
): Promise<ColumnarTable> {
  installBufferPolyfill();
  const blob = new Blob([arrayBuffer]);
  const file = new BlobFile(blob);
  const reader = new ParquetReader(file);

  for await (const batch of parseParquetFileInColumnarBatches(reader, options)) {
    return {
      shape: 'columnar-table',
      schema: batch.schema,
      data: batch.data
    };
  }
  throw new Error('empty table');
}

export async function* parseParquetFileInColumnarBatches(
  reader: ParquetReader,
  options?: ParquetLoaderOptions
): AsyncIterable<ColumnarTableBatch> {
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
