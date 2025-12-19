// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Table} from '@loaders.gl/schema';
import {
  convertSchemaToArrow,
  getTableLength,
  getTableNumCols,
  getTableCellAt
} from '@loaders.gl/schema-utils';

export function* makeTableToArrowBatchesIterator(
  table: Table,
  options?: {batchSize?: number}
): IterableIterator<arrow.RecordBatch> {
  const arrowSchema = convertSchemaToArrow(table.schema!);

  const length = getTableLength(table);
  const numColumns = getTableNumCols(table);
  const batchSize = options?.batchSize || length;

  const builders = arrowSchema?.fields.map((arrowField) => arrow.makeBuilder(arrowField));
  const structField = new arrow.Struct(arrowSchema.fields);

  let batchLength = 0;
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    for (let columnIndex = 0; columnIndex < numColumns; ++columnIndex) {
      const value = getTableCellAt(table, rowIndex, columnIndex);

      const builder = builders[columnIndex];
      builder.append(value);
      batchLength++;

      if (batchLength >= batchSize) {
        const datas = builders.map((builder) => builder.flush());
        const structData = new arrow.Data(structField, 0, batchLength, 0, undefined, datas);
        yield new arrow.RecordBatch(arrowSchema, structData);
        batchLength = 0;
      }
    }
  }

  if (batchLength > 0) {
    const datas = builders.map((builder) => builder.flush());
    const structData = new arrow.Data(structField, 0, batchLength, 0, undefined, datas);
    yield new arrow.RecordBatch(arrowSchema, structData);
    batchLength = 0;
  }

  builders.map((builder) => builder.finish());
}
