// Type deduction
import {Schema, Field} from '../../common-types';
import {Table} from '../table-types';
import {getTypeFromTypedArray, getTypeFromValue} from './deduce-column-type';

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
      return deduceSchema(table.data);
    case 'arrow-table':
    default:
      throw new Error('Convert arrow schema');
  }
}

export function deduceSchema(
  data: unknown[][] | {[key: string]: unknown}[] | {[key: string]: unknown[]}
): Schema {
  return Array.isArray(data) ? deduceSchemaForRowTable(data) : deduceSchemaForColumnarTable(data);
}

function deduceSchemaForColumnarTable(columnarTable: {[key: string]: unknown}): Schema {
  const fields: Field[] = [];
  for (const [columnName, column] of Object.entries(columnarTable)) {
    const field = deduceFieldFromColumn(column, columnName);
    fields.push(field);
  }
  return {fields, metadata: new Map()};
}

function deduceSchemaForRowTable(rowTable: unknown[][] | {[key: string]: unknown}[]): Schema {
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

  return {fields, metadata: new Map()};
}

function deduceFieldFromColumn(column: unknown, name: string): Field {
  if (ArrayBuffer.isView(column)) {
    const type = getTypeFromTypedArray(column);
    return {
      name,
      type,
      nullable: false,
      metadata: new Map()
    };
  }

  if (Array.isArray(column) && column.length > 0) {
    const value = column[0];
    const type = getTypeFromValue(value);
    // TODO - support nested schemas?
    return {
      name,
      type,
      nullable: true,
      metadata: new Map()
    };
  }

  throw new Error('empty table');
}

function deduceFieldFromValue(value: unknown, name: string) {
  const type = getTypeFromValue(value);
  return {
    name,
    type,
    nullable: true,
    metadata: new Map()
  };
}
