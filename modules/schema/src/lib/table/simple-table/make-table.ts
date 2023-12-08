// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, ArrayRowTable, ObjectRowTable, ColumnarTable} from '../../../types/category-table';
import {deduceTableSchema} from './table-schema';

/**
 * Makes a typed table from data.
 * @throws Row tables must contain at least one row. Columnar tables must contain empty arrays
 */
export function makeTableFromData(data: unknown[][]): ArrayRowTable;
export function makeTableFromData(data: {[column: string]: unknown}[]): ObjectRowTable;
export function makeTableFromData(data: {[column: string]: ArrayLike<unknown>}): ColumnarTable;
export function makeTableFromData(data: unknown): Table {
  let table: Table;
  switch (getTableShapeFromData(data)) {
    case 'array-row-table':
      table = {shape: 'array-row-table', data: data as unknown[][]};
      break;
    case 'object-row-table':
      table = {shape: 'object-row-table', data: data as {[key: string]: unknown}[]};
      break;
    case 'columnar-table':
      table = {shape: 'columnar-table', data: data as {[column: string]: ArrayLike<unknown>}};
      break;
    default:
      throw new Error('table');
  }
  const schema = deduceTableSchema(table);
  return {...table, schema};
}

/** Helper function to get shape of data */
function getTableShapeFromData(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error('cannot deduce type of empty table');
    }

    // Deduce the table shape from the first row
    const firstRow = data[0];

    if (Array.isArray(firstRow)) {
      return 'array-row-table';
    }

    if (firstRow && typeof firstRow === 'object') {
      return 'object-row-table';
    }
  }

  if (data && typeof data === 'object') {
    return 'columnar-table';
  }

  throw new Error('invalid table');
}

/** Convert any table into object row format *
export function makeColumnarTable(table: Table): ColumnarTable {
  if (table.shape === 'columnar-table') {
    return table;
  }
  const length = getTableLength(table);
  const data = new Array<{[key: string]: unknown}>(length);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    data[rowIndex] = getTableRowAsObject(table, rowIndex);
  }
  return {
    shape: 'columnar-table',
    schema: table.schema,
    data
  };
}


/** Convert any table into array row format *
export function makeArrayRowTable(table: TableLike): ArrayRowTable {
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

/** Convert any table into object row format *
export function makeObjectRowTable(table: Table): ObjectRowTable {
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
*/
