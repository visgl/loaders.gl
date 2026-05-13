// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, DataType, Field, ObjectRowTable, Schema} from '@loaders.gl/schema';
import {ArrowTableBuilder, makeTableFromData} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

/**
 * Converts parsed Excel rows to an Arrow table, including empty sheets.
 *
 * @param rows - Parsed Excel rows keyed by worksheet column name.
 * @returns A loaders.gl Arrow table with one Apache Arrow column per row property.
 */
export function convertExcelRowsToArrowTable(rows: {[key: string]: unknown}[]): ArrowTable {
  const table: ObjectRowTable =
    rows.length > 0
      ? makeTableFromData(rows)
      : {shape: 'object-row-table', schema: {fields: [], metadata: {}}, data: rows};
  const schema = deducePrimitiveAwareSchema(table);

  if (table.data.length === 0 || schema.fields.length === 0) {
    return {
      shape: 'arrow-table',
      schema,
      data: new arrow.Table(new arrow.Schema([]))
    };
  }

  const arrowTableBuilder = new ArrowTableBuilder(schema);
  for (const row of table.data) {
    arrowTableBuilder.addObjectRow(row);
  }
  return arrowTableBuilder.finishTable();
}

/**
 * Deduces a schema that handles primitive numbers and booleans in Excel rows.
 *
 * @param table - Object-row table produced from parsed Excel rows.
 * @returns A schema with primitive values promoted from `null` to Arrow-compatible types.
 */
function deducePrimitiveAwareSchema(table: ObjectRowTable): Schema {
  const fields = table.schema!.fields.map((field): Field => {
    if (field.type === 'float32') {
      return {...field, type: 'float64'};
    }

    if (field.type !== 'null') {
      return field;
    }

    for (const row of table.data) {
      const type = getDataTypeFromPrimitive(row[field.name]);
      if (type !== 'null') {
        return {...field, type};
      }
    }

    return field;
  });

  return {...table.schema!, fields};
}

/**
 * Deduces a loaders.gl data type from primitive spreadsheet cell values.
 *
 * @param value - Spreadsheet cell value.
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
