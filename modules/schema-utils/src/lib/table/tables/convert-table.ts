// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Table,
  ArrayRowTable,
  ObjectRowTable,
  ColumnarTable,
  ArrowTable
} from '@loaders.gl/schema';
import {
  getTableCell,
  getTableLength,
  getTableRowAsArray,
  getTableRowAsObject
} from './table-accessors';
import {deduceTableSchema} from '../../schema/deduce-table-schema';
import {makeColumnFromField} from './table-column';
import {convertTableToArrow} from './convert-arrow-table';

export function convertTable(table: Table, shape: 'object-row-table'): ObjectRowTable;
export function convertTable(table: Table, shape: 'array-row-table'): ArrayRowTable;
export function convertTable(table: Table, shape: 'columnar-table'): ColumnarTable;
export function convertTable(table: Table, shape: 'arrow-table'): ArrowTable;

/**
 * Convert a table to a different shape
 * @param table
 * @param shape
 * @returns
 */
export function convertTable(
  table: Table,
  shape: 'object-row-table' | 'array-row-table' | 'columnar-table' | 'arrow-table'
) {
  switch (shape) {
    case 'object-row-table':
      return convertToObjectRowTable(table);
    case 'array-row-table':
      return convertToArrayRowTable(table);
    case 'columnar-table':
      return convertToColumnarTable(table);
    case 'arrow-table':
      return convertToArrowTable(table);
    default:
      throw new Error(shape);
  }
}

/** Convert any simple table into columnar format */
export function convertToColumnarTable(table: Table): ColumnarTable {
  // TODO - should schema really be optional?
  const schema = table.schema || deduceTableSchema(table);
  const fields = table.schema?.fields || [];

  if (table.shape === 'columnar-table') {
    return {...table, schema};
  }

  const length = getTableLength(table);

  const columns: {[column: string]: ArrayLike<unknown>} = {};
  for (const field of fields) {
    const column = makeColumnFromField(field, length);
    columns[field.name] = column;
    for (let rowIndex = 0; rowIndex < length; rowIndex++) {
      column[rowIndex] = getTableCell(table, rowIndex, field.name);
    }
  }

  return {
    shape: 'columnar-table',
    schema,
    data: columns
  };
}

/** Convert any table into array row format */
export function convertToArrayRowTable(table: Table): ArrayRowTable {
  if (table.shape === 'array-row-table') {
    return table;
  }
  const length = getTableLength(table);
  const data = new Array<unknown[]>(length);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    data[rowIndex] = getTableRowAsArray(table, rowIndex);
  }
  return {
    shape: 'array-row-table',
    schema: table.schema,
    data
  };
}

/** Convert any table into object row format */
export function convertToObjectRowTable(table: Table): ObjectRowTable {
  if (table.shape === 'object-row-table') {
    return table;
  }
  const length = getTableLength(table);
  const data = new Array<{[key: string]: unknown}>(length);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    data[rowIndex] = getTableRowAsObject(table, rowIndex);
  }
  return {
    shape: 'object-row-table',
    schema: table.schema,
    data
  };
}

/**
 * Convert a table to apache arrow format
 * @note this depends on the `@loaders.gl/arrow module being imported
 */
export function convertToArrowTable(table: Table): ArrowTable {
  const arrowTable = convertTableToArrow(table);
  return {
    shape: 'arrow-table',
    schema: table.schema,
    data: arrowTable
  };
}

/**
 *
 * @note - should be part of schema module
 *
export function convertColumnarToRowFormatTable(columnarTable: ColumnarTable): ObjectRowTable {
  const tableKeys = Object.keys(columnarTable);
  const tableRowsCount = columnarTable[tableKeys[0]].length;

  const rowFormatTable: {}[] = [];

  for (let index = 0; index < tableRowsCount; index++) {
    const tableItem = {};
    for (let keyIndex = 0; keyIndex < tableKeys.length; keyIndex++) {
      const fieldName = tableKeys[keyIndex];
      tableItem[fieldName] = columnarTable[fieldName][index];
    }
    rowFormatTable.push(tableItem);
  }

  return {
    shape: 'object-row-table',
    schema: columnarTable.schema,
    data: rowFormatTable
  };
}
*/
