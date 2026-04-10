// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema} from '@loaders.gl/schema';
import {ParquetRowGroup} from '@loaders.gl/parquet/parquetjs/schema/declare';

export function convertParquetRowGroupToColumns(
  schema: Schema,
  rowGroup: ParquetRowGroup
): Record<string, any[]> {
  const columns: Record<string, any[]> = {};
  for (const [columnName, data] of Object.entries(rowGroup.columnData)) {
    columns[columnName] = columns[columnName] || data.values;
  }
  return columns;
}
