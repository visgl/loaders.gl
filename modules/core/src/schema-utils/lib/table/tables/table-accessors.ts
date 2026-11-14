// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-else-return */

import type {Table as NativeArrowTable} from 'apache-arrow';
import {isNativeArrowTable} from '../../../../lib/loader-utils/native-arrow';
import {convertArrowToSchema} from '../../schema/convert-arrow-schema';
import type {Table, ArrayRowTable, ObjectRowTable} from '@loaders.gl/core/schema';

/** Checks whether a value is a native Arrow table or a loaders.gl table. */
export function isTable(table: any): table is Table | NativeArrowTable {
  if (isNativeArrowTable(table)) return true;
  const shape = typeof table === 'object' && table?.shape;
  switch (shape) {
    case 'array-row-table':
    case 'object-row-table':
      return Array.isArray(table.data);

    case 'geojson-table':
      return Array.isArray(table.features);

    case 'columnar-table':
      return Boolean(table.data && typeof table.data === 'object');

    case 'arrow-table':
      return Boolean(table?.data?.numRows !== undefined);

    default:
      return false;
  }
}

/**
 * Returns the length of the table (i.e. the number of rows)
 */
export function getTableLength(table: Table | NativeArrowTable): number {
  if (!('shape' in table)) return table.numRows;
  switch (table.shape) {
    case 'array-row-table':
    case 'object-row-table':
      return table.data.length;

    case 'geojson-table':
      return table.features.length;

    case 'arrow-table':
      return getTableLength(table.data);

    case 'columnar-table':
      for (const column of Object.values(table.data)) {
        return column.length || 0;
      }
      return 0;
    default:
      throw new Error('table');
  }
}

/**
 * Returns the number of columns in the table
 * @throws Fails to deduce number of columns if the table has no schema and is empty
 */
export function getTableNumCols(table: Table | NativeArrowTable): number {
  if (!('shape' in table)) return table.numCols;
  if (table.schema) {
    return table.schema.fields.length;
  }
  if (getTableLength(table) === 0) {
    throw new Error('empty table');
  }
  switch (table.shape) {
    case 'array-row-table':
      return table.data[0].length;
    case 'object-row-table':
      return Object.keys(table.data[0]).length;
    case 'geojson-table':
      return Object.keys(table.features[0]).length;
    case 'columnar-table':
      return Object.keys(table.data).length;
    case 'arrow-table':
      return getTableNumCols(table.data);

    default:
      throw new Error('table');
  }
}

/** Get a table cell value at row index and column name */
export function getTableCell(
  table: Table | NativeArrowTable,
  rowIndex: number,
  columnName: string
): unknown {
  if (!('shape' in table)) return table.getChild(columnName)?.get(rowIndex);
  switch (table.shape) {
    case 'array-row-table':
      const columnIndex = getTableColumnIndex(table, columnName);
      return table.data[rowIndex][columnIndex];

    case 'object-row-table':
      return table.data[rowIndex][columnName];

    case 'geojson-table':
      return table.features[rowIndex][columnName];

    case 'columnar-table':
      const column = table.data[columnName];
      return column[rowIndex];

    case 'arrow-table':
      return getTableCell(table.data, rowIndex, columnName);

    default:
      throw new Error('todo');
  }
}

/** Get a table cell value at row index and column name */
export function getTableCellAt(
  table: Table | NativeArrowTable,
  rowIndex: number,
  columnIndex: number
): unknown {
  if (!('shape' in table)) return table.getChildAt(columnIndex)?.get(rowIndex);
  switch (table.shape) {
    case 'array-row-table':
      return table.data[rowIndex][columnIndex];

    case 'object-row-table':
      const columnName1 = getTableColumnName(table, columnIndex);
      return table.data[rowIndex][columnName1];

    case 'geojson-table':
      const columnName2 = getTableColumnName(table, columnIndex);
      return table.features[rowIndex][columnName2];

    case 'columnar-table':
      const columnName3 = getTableColumnName(table, columnIndex);
      const column = table.data[columnName3];
      return column[rowIndex];

    case 'arrow-table':
      return getTableCellAt(table.data, rowIndex, columnIndex);

    default:
      throw new Error('todo');
  }
}

/** Deduce the table row shape */
export function getTableRowShape(
  table: Table | NativeArrowTable
): 'array-row-table' | 'object-row-table' {
  if (!('shape' in table)) throw new Error('Not a row table');
  switch (table.shape) {
    case 'array-row-table':
    case 'object-row-table':
      return table.shape;

    case 'geojson-table':
      // TODO - this is not correct, geojson-table is not a row table
      return 'object-row-table';

    case 'columnar-table':
    default:
      throw new Error('Not a row table');
  }
}

/** Get the index of a named table column. Requires the table to have a schema */
export function getTableColumnIndex(table: Table | NativeArrowTable, columnName: string): number {
  const columnIndex = table.schema?.fields.findIndex(field => field.name === columnName);
  if (columnIndex === undefined) {
    throw new Error(columnName);
  }
  return columnIndex;
}

/** Get the name of a table column by index. Requires the table to have a schema */
export function getTableColumnName(table: Table | NativeArrowTable, columnIndex: number): string {
  const columnName = table.schema?.fields[columnIndex]?.name;
  if (!columnName) {
    throw new Error(`${columnIndex}`);
  }
  return columnName;
}

/**
 * Returns one row of the table in object format.
 * @param target Optional parameter will be used if needed to store the row. Can be reused between calls to improve performance
 * @returns an array representing the row. May be the original array in the row, a new object, or the target parameter
 */
// eslint-disable-next-line complexity
export function getTableRowAsObject(
  table: Table | NativeArrowTable,
  rowIndex: number,
  target?: {[columnName: string]: unknown},
  copy?: 'copy'
): {[columnName: string]: unknown} {
  if (!('shape' in table)) {
    const objectRow = target || {};
    const row = table.get(rowIndex);
    for (const field of table.schema.fields) objectRow[field.name] = row?.[field.name];
    return objectRow;
  }
  switch (table.shape) {
    case 'object-row-table':
      return copy ? Object.fromEntries(Object.entries(table.data[rowIndex])) : table.data[rowIndex];

    case 'array-row-table':
      if (table.schema) {
        const objectRow: {[columnName: string]: unknown} = target || {};
        for (let i = 0; i < table.schema.fields.length; i++) {
          objectRow[table.schema.fields[i].name] = table.data[rowIndex][i];
        }
        return objectRow;
      }
      throw new Error('no schema');

    case 'geojson-table':
      if (table.schema) {
        const objectRow: {[columnName: string]: unknown} = target || {};
        // TODO - should lift properties to top level
        for (let i = 0; i < table.schema.fields.length; i++) {
          objectRow[table.schema.fields[i].name] =
            table.features[rowIndex][table.schema.fields[i].name];
        }
        return objectRow;
      }
      throw new Error('no schema');

    case 'columnar-table':
      if (table.schema) {
        const objectRow: {[columnName: string]: unknown} = target || {};
        for (let i = 0; i < table.schema.fields.length; i++) {
          objectRow[table.schema.fields[i].name] =
            table.data[table.schema.fields[i].name][rowIndex];
        }
        return objectRow;
      } else {
        // eslint-disable-line no-else-return
        const objectRow: {[columnName: string]: unknown} = target || {};
        for (const [name, column] of Object.entries(table.data)) {
          objectRow[name] = column[rowIndex];
        }
        return objectRow;
      }

    case 'arrow-table':
      return getTableRowAsObject(table.data, rowIndex, target, copy);

    default:
      throw new Error('shape');
  }
}

/**
 * Returns one row of the table in array format.
 * @param target Optional parameter will be used if needed to store the row. Can be reused between calls to improve performance.
 * @returns an array representing the row. May be the original array in the row, a new object, or the target parameter
 */
// eslint-disable-next-line complexity
export function getTableRowAsArray(
  table: Table | NativeArrowTable,
  rowIndex: number,
  target?: unknown[],
  copy?: 'copy'
): unknown[] {
  if (!('shape' in table)) {
    const arrayRow = target || [];
    const row = table.get(rowIndex);
    table.schema.fields.forEach((field, columnIndex) => {
      arrayRow[columnIndex] = row?.[field.name];
    });
    return arrayRow;
  }
  switch (table.shape) {
    case 'array-row-table':
      return copy ? Array.from(table.data[rowIndex]) : table.data[rowIndex];

    case 'object-row-table':
      if (table.schema) {
        const arrayRow: unknown[] = target || [];
        for (let i = 0; i < table.schema.fields.length; i++) {
          arrayRow[i] = table.data[rowIndex][table.schema.fields[i].name];
        }
        return arrayRow;
      }
      // Warning: just slap on the values, this risks mismatches between rows
      return Object.values(table.data[rowIndex]);

    case 'geojson-table':
      if (table.schema) {
        const arrayRow: unknown[] = target || [];
        // TODO - should lift properties to top level
        for (let i = 0; i < table.schema.fields.length; i++) {
          arrayRow[i] = table.features[rowIndex][table.schema.fields[i].name];
        }
        return arrayRow;
      }
      // Warning: just slap on the values, this risks mismatches between rows
      return Object.values(table.features[rowIndex]);

    case 'columnar-table':
      if (table.schema) {
        const arrayRow: unknown[] = target || [];
        for (let i = 0; i < table.schema.fields.length; i++) {
          arrayRow[i] = table.data[table.schema.fields[i].name][rowIndex];
        }
        return arrayRow;
      } else {
        // eslint-disable-line no-else-return
        const arrayRow: unknown[] = target || [];
        let i = 0;
        for (const column of Object.values(table.data)) {
          arrayRow[i] = column[rowIndex];
          i++;
        }
        return arrayRow;
      }

    case 'arrow-table':
      return getTableRowAsArray(table.data, rowIndex, target, copy);

    default:
      throw new Error('shape');
  }
}

/** Convert any table into array row format */
export function makeArrayRowTable(table: Table | NativeArrowTable): ArrayRowTable {
  if ('shape' in table && table.shape === 'array-row-table') {
    return table;
  }
  const length = getTableLength(table);
  const data = new Array<unknown[]>(length);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    data[rowIndex] = getTableRowAsArray(table, rowIndex);
  }
  return {
    shape: 'array-row-table',
    schema: 'shape' in table ? table.schema : convertArrowToSchema(table.schema),
    data
  };
}

/** Convert any table into object row format */
export function makeObjectRowTable(table: Table | NativeArrowTable): ObjectRowTable {
  if ('shape' in table && table.shape === 'object-row-table') {
    return table;
  }
  const length = getTableLength(table);
  const data = new Array<{[key: string]: unknown}>(length);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    data[rowIndex] = getTableRowAsObject(table, rowIndex);
  }
  return {
    shape: 'object-row-table',
    schema: 'shape' in table ? table.schema : convertArrowToSchema(table.schema),
    data
  };
}

/** Convert any table into object row format */
export function makeColumnarTable(table: Table | NativeArrowTable): ObjectRowTable {
  if ('shape' in table && table.shape === 'object-row-table') {
    return table;
  }
  const length = getTableLength(table);
  const data = new Array<{[key: string]: unknown}>(length);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    data[rowIndex] = getTableRowAsObject(table, rowIndex);
  }
  return {
    shape: 'object-row-table',
    schema: 'shape' in table ? table.schema : convertArrowToSchema(table.schema),
    data
  };
}

// Row Iterators

/**
 * Iterate over table rows
 * @param table
 * @param shape
 */
export function* makeRowIterator(
  table: Table | NativeArrowTable,
  shape: 'object-row-table' | 'array-row-table'
): Iterable<unknown[] | {[key: string]: unknown}> {
  switch (shape) {
    case 'array-row-table':
      yield* makeArrayRowIterator(table);
      break;
    case 'object-row-table':
      yield* makeObjectRowIterator(table);
      break;

    default:
      throw new Error(`Unknown row type ${shape}`);
  }
}

/**
 * Streaming processing: Iterate over table, yielding array rows
 * @param table
 * @param shape
 */
export function* makeArrayRowIterator(
  table: Table | NativeArrowTable,
  target: unknown[] = []
): Iterable<unknown[]> {
  const length = getTableLength(table);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    yield getTableRowAsArray(table, rowIndex, target);
  }
}

/**
 * Streaming processing: Iterate over table, yielding object rows
 * @param table
 * @param shape
 */
export function* makeObjectRowIterator(
  table: Table | NativeArrowTable,
  target: {[key: string]: unknown} = {}
): Iterable<{[key: string]: unknown}> {
  const length = getTableLength(table);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    yield getTableRowAsObject(table, rowIndex, target);
  }
}
