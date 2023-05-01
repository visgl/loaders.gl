// loaders.gl, MIT license

// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {ColumnarTable, ColumnarTableBatch, Schema} from '@loaders.gl/schema';
import {makeReadableFile} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../../parquet-loader';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {ParquetRowGroup} from '../../parquetjs/schema/declare';
import {ParquetSchema} from '../../parquetjs/schema/schema';
import {convertParquetSchema} from '../arrow/convert-schema-from-parquet';
import {materializeColumns} from '../../parquetjs/schema/shred';
// import {convertParquetRowGroupToColumns} from '../arrow/convert-row-group-to-columns';
import {unpackGeoMetadata} from '../geo/decode-geo-metadata';

export async function parseParquetInColumns(
  arrayBuffer: ArrayBuffer,
  options?: ParquetLoaderOptions
): Promise<ColumnarTable> {
  const blob = new Blob([arrayBuffer]);
  for await (const batch of parseParquetFileInColumnarBatches(blob, options)) {
    return {
      shape: 'columnar-table',
      schema: batch.schema,
      data: batch.data
    };
  }
  throw new Error('empty table');
}

export async function* parseParquetFileInColumnarBatches(
  blob: Blob,
  options?: ParquetLoaderOptions
): AsyncIterable<ColumnarTableBatch> {
  const file = makeReadableFile(blob);
  const reader = new ParquetReader(file);
  const parquetSchema = await reader.getSchema();
  const parquetMetadata = await reader.getFileMetadata();
  const schema = convertParquetSchema(parquetSchema, parquetMetadata);
  unpackGeoMetadata(schema);
  const rowGroups = reader.rowGroupIterator(options?.parquet);
  for await (const rowGroup of rowGroups) {
    yield convertRowGroupToTableBatch(parquetSchema, rowGroup, schema);
  }
}

function convertRowGroupToTableBatch(
  parquetSchema: ParquetSchema,
  rowGroup: ParquetRowGroup,
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
