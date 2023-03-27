// loaders.gl, MIT license

// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {ColumnarTableBatch, Schema} from '@loaders.gl/schema';
import {makeReadableFile} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../../parquet-loader';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {ParquetBuffer} from '../../parquetjs/schema/declare';
import {convertSchemaFromParquet} from '../arrow/convert-schema-from-parquet';
import {convertParquetRowGroupToColumns} from '../arrow/convert-row-group-to-columns';

export async function parseParquetInColumns(
  arrayBuffer: ArrayBuffer,
  options?: ParquetLoaderOptions
) {
  const blob = new Blob([arrayBuffer]);
  for await (const batch of parseParquetFileInColumnarBatches(blob, options)) {
    return batch;
  }
  return null;
}

export async function* parseParquetFileInColumnarBatches(
  blob: Blob,
  options?: ParquetLoaderOptions
): AsyncIterable<ColumnarTableBatch> {
  const file = makeReadableFile(blob);
  const reader = new ParquetReader(file);
  const parquetSchema = await reader.getSchema();
  const schema = convertSchemaFromParquet(parquetSchema);
  const rowGroups = reader.rowGroupIterator(options?.parquet);
  for await (const rowGroup of rowGroups) {
    yield convertRowGroupToTableBatch(schema, rowGroup);
  }
}

function convertRowGroupToTableBatch(schema: Schema, rowGroup: ParquetBuffer): ColumnarTableBatch {
  const data = convertParquetRowGroupToColumns(schema, rowGroup);
  return {
    shape: 'columnar-table',
    batchType: 'data',
    schema,
    data,
    length: rowGroup.rowCount
  };
}
