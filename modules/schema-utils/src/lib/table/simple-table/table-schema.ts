// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Type deduction
import {Schema, Field} from '../../../types/schema';
import {ArrayType} from '../../../types/types';
import {Table} from '../../../types/category-table';
import {getDataTypeFromArray, getDataTypeFromValue} from './data-type';

/**
 * SCHEMA SUPPORT - AUTODEDUCTION
 * @param {*} table
 * @param {*} schema
 * @returns
 */
export function deduceTableSchema(table: Table): Schema {
  switch (table.shape) {
    case 'array-row-table':
    case 'object-row-table':
      return deduceSchemaFromRows(table.data);

    case 'geojson-table':
      return deduceSchemaFromGeoJSON(table.features);

    case 'columnar-table':
      return deduceSchemaFromColumns(table.data);

    case 'arrow-table':
    default:
      throw new Error('Deduce schema');
  }
}

export function deduceSchema(
  data: unknown[][] | {[key: string]: unknown}[] | {[key: string]: unknown[]}
): Schema {
  return Array.isArray(data) ? deduceSchemaFromRows(data) : deduceSchemaFromColumns(data);
}

/** Given an object with columnar arrays, try to deduce a schema */
function deduceSchemaFromColumns(columnarTable: {[key: string]: ArrayType}): Schema {
  const fields: Field[] = [];
  for (const [columnName, column] of Object.entries(columnarTable)) {
    const field = deduceFieldFromColumn(column, columnName);
    fields.push(field);
  }
  return {fields, metadata: {}};
}

/** Given an array of rows, try to deduce a schema */
function deduceSchemaFromRows(rowTable: unknown[][] | {[key: string]: unknown}[]): Schema {
  if (!rowTable.length) {
    throw new Error('deduce from empty table');
  }
  const fields: Field[] = [];
  const row0 = rowTable[0];
  // TODO - fields can be nullable, false detection...
  // Could look at additional rows if nulls in first row
  // TODO - if array, column names will be numbers
  for (const [columnName, value] of Object.entries(row0)) {
    fields.push(deduceFieldFromValue(value, columnName));
  }

  return {fields, metadata: {}};
}

/** Given a GeoJSON, try to deduce a schema */
function deduceSchemaFromGeoJSON(features: {properties: Record<string, number> | null}[]): Schema {
  if (!features.length) {
    throw new Error('deduce from empty table');
  }
  const fields: Field[] = [];
  const row0 = features[0].properties || {};
  // TODO - fields can be nullable, false detection...
  // Could look at additional rows if nulls in first row
  // TODO - if array, column names will be numbers
  for (const [columnName, value] of Object.entries(row0)) {
    fields.push(deduceFieldFromValue(value, columnName));
  }

  return {fields, metadata: {}};
}

/** Given a column (i.e. array), attempt to deduce an appropriate `Field` */
function deduceFieldFromColumn(column: ArrayType, name: string): Field {
  if (ArrayBuffer.isView(column)) {
    const type = getDataTypeFromArray(column);
    return {
      name,
      type: type.type || 'null',
      nullable: type.nullable
      // metadata: {}
    };
  }

  if (Array.isArray(column) && column.length > 0) {
    const value = column[0];
    const type = getDataTypeFromValue(value);
    // TODO - support nested schemas?
    return {
      name,
      type,
      nullable: true
      // metadata: {},
    };
  }

  throw new Error('empty table');
}

/** Given a value, attempt to deduce an appropriate `Field` */
function deduceFieldFromValue(value: unknown, name: string): Field {
  const type = getDataTypeFromValue(value);
  return {
    name,
    type,
    nullable: true
    // metadata: {}
  };
}
