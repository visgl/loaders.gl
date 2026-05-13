// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  Batch,
  DataType,
  Field,
  ObjectRowTable,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import {ArrowTableBuilder, makeTableFromData} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

/**
 * Converts row-oriented tables to Arrow tables while preserving nullable primitive inference.
 *
 * @param table - Object-row or array-row table to convert.
 * @returns Arrow table wrapper containing the same rows.
 */
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

/**
 * Converts data batches emitted as row tables into Arrow table batches.
 *
 * Non-row metadata/final-result batches are passed through unchanged.
 *
 * @param batches - Batch iterator that yields row-table batches.
 * @returns Async iterable of Arrow table batches plus any untouched non-row batches.
 */
export async function* convertTableBatchesToArrow<TBatch extends Batch = never>(
  batches: AsyncIterable<TableBatch | TBatch>
): AsyncIterable<TableBatch | ArrowTableBatch | TBatch> {
  for await (const batch of batches) {
    if (
      (batch.shape === 'object-row-table' || batch.shape === 'array-row-table') &&
      Array.isArray(batch.data) &&
      batch.length > 0
    ) {
      const arrowTable = convertRowTableToArrowTable(batch as ObjectRowTable | ArrayRowTable);
      yield {
        ...batch,
        shape: 'arrow-table',
        schema: arrowTable.schema,
        data: arrowTable.data,
        length: arrowTable.data.numRows
      };
      continue;
    }

    yield batch;
  }
}

/**
 * Creates an Arrow table for rows without fields.
 *
 * Apache Arrow JS normalizes empty-field record batches to zero rows, so this
 * preserves the row count on the empty struct data before wrapping it in a table.
 *
 * @param schema - Empty loaders.gl schema inferred from the row table.
 * @param rowCount - Number of parsed rows in the row table.
 * @returns An Arrow table with zero columns and the original row count.
 */
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

/**
 * Deduces a schema that handles primitive numbers and booleans in row tables.
 *
 * @param table - Row table produced from parsed JSON objects.
 * @returns A schema with primitive values promoted from `null` to Arrow-compatible types.
 */
function deducePrimitiveAwareSchema(table: ObjectRowTable | ArrayRowTable): Schema {
  const schema = table.schema || deduceSchemaFromRows(table);
  const fields = schema.fields.map((field, fieldIndex): Field => {
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

  return {...schema, fields};
}

/**
 * Deduces a schema from row data when streamed batches do not include one.
 *
 * @param table - Row table produced by a parser or batch builder.
 * @returns Deduced schema for the row table.
 */
function deduceSchemaFromRows(table: ObjectRowTable | ArrayRowTable): Schema {
  if (table.data.length === 0) {
    return {fields: [], metadata: {}};
  }

  return table.shape === 'array-row-table'
    ? makeTableFromData(table.data as unknown[][]).schema!
    : makeTableFromData(table.data as {[key: string]: unknown}[]).schema!;
}

/**
 * Deduces a loaders.gl data type from primitive property values.
 *
 * @param value - Property value.
 * @returns The matching loaders.gl data type, or `null` for unsupported values.
 */
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
