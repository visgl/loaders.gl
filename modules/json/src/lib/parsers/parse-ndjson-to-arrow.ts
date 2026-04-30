// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  DataType,
  Field,
  ObjectRowTable,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

export async function* makeNDJSONArrowBatchIterator(
  batches: AsyncIterable<TableBatch>
): AsyncIterable<ArrowTableBatch> {
  for await (const batch of batches) {
    const arrowTable = convertRowTableToArrowTable(batch as ObjectRowTable | ArrayRowTable);
    yield {
      ...batch,
      shape: 'arrow-table',
      schema: arrowTable.schema,
      data: arrowTable.data,
      length: arrowTable.data.numRows
    };
  }
}

export function convertRowTableToArrowTable(table: ObjectRowTable | ArrayRowTable): ArrowTable {
  const schema = deducePrimitiveAwareSchema(table);
  if (schema.fields.length === 0) {
    return makeEmptyFieldArrowTable(schema, table.data.length);
  }

  const arrowTableBuilder = new ArrowTableBuilder(schema);

  switch (table.shape) {
    case 'array-row-table':
      for (const row of table.data) {
        arrowTableBuilder.addArrayRow(row);
      }
      break;
    case 'object-row-table':
      for (const row of table.data) {
        arrowTableBuilder.addObjectRow(row);
      }
      break;
    default:
      throw new Error('invalid row table shape');
  }

  return arrowTableBuilder.finishTable();
}

function makeEmptyFieldArrowTable(schema: Schema, rowCount: number): ArrowTable {
  const arrowSchema = new arrow.Schema([]);
  const arrowData = new arrow.Data(new arrow.Struct([]), 0, rowCount, 0, undefined, []);
  const arrowRecordBatch = new arrow.RecordBatch(arrowSchema, arrowData);
  Object.defineProperty(arrowRecordBatch, 'data', {value: arrowData});

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table([arrowRecordBatch])
  };
}

function deducePrimitiveAwareSchema(table: ObjectRowTable | ArrayRowTable): Schema {
  const fields = table.schema!.fields.map((field, fieldIndex): Field => {
    if (field.type !== 'null') {
      return field;
    }

    for (const row of table.data) {
      const value = table.shape === 'array-row-table' ? row[fieldIndex] : row[field.name];
      const type = getDataTypeFromPrimitive(value);
      if (type !== 'null') {
        return {...field, type};
      }
    }

    return field;
  });

  return {...table.schema!, fields};
}

function getDataTypeFromPrimitive(value: unknown): DataType {
  switch (typeof value) {
    case 'number':
      return 'float64';
    case 'boolean':
      return 'bool';
    case 'string':
      return 'utf8';
    default:
      return value instanceof Date ? 'date-millisecond' : 'null';
  }
}
