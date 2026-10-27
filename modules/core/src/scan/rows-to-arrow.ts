// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import type {ArrowTable, Field, ObjectRowTable, Schema} from '@loaders.gl/core/schema';
import {makeTableFromData, getDataTypeFromArray} from '@loaders.gl/core/schema-utils';

/** Converts object rows into a loaders.gl Arrow table. */
export function convertRowsToArrowTable(rows: Record<string, unknown>[]): ArrowTable {
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

  return {
    shape: 'arrow-table',
    schema,
    data: arrow.tableFromJSON(table.data)
  };
}

/** Infer primitive field types for materialized rows. */
function deducePrimitiveAwareSchema(table: ObjectRowTable): Schema {
  return {
    ...table.schema!,
    fields: table.schema!.fields.map((field): Field => {
      if (field.type !== 'null') {
        return field;
      }

      const columnValues = table.data.map(row => row[field.name]);
      const inferredType = getDataTypeFromArray(columnValues);
      return {...field, type: inferredType.type, nullable: inferredType.nullable};
    })
  };
}
