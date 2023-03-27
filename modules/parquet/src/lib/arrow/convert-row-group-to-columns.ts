// loaders.gl, MIT license

import {Schema} from '@loaders.gl/schema';
import {ParquetBuffer} from '@loaders.gl/parquet/parquetjs/schema/declare';

export function convertParquetRowGroupToColumns(schema: Schema, rowGroup: ParquetBuffer): Record<string, any[]> {
  const columns: Record<string, any[]> = {};
  for (const [columnName, data] of Object.entries(rowGroup.columnData)) {
    columns[columnName] = columns[columnName] || data.values;
  }
  return columns;
}
