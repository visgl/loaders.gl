// loaders.gl, MIT license

import {Table, ArrayRowTable, ObjectRowTable} from '../table-types';

/**
 * Returns the length of the table (i.e. the number of rows)
 */
export function getTableLength(table: Table): number {
  switch (table.shape) {
    case 'array-row-table':
    case 'object-row-table':
    case 'geojson-row-table':
      return table.data.length;

    case 'columnar-table':
      const firstColumnName = getTableColumnName(table, 0);
      return table.data[firstColumnName].length || 0;

    case 'arrow-table':
      return table.data.numRows;
  }
}

/**
 * Returns the number of columns in the table
 * @throws Fails to deduce number of columns if the table has no schema and is empty
 */
export function getTableNumCols(table: Table): number {
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
    case 'geojson-row-table':
      return Object.keys(table.data[0]).length;

    case 'columnar-table':
      return Object.keys(table.data).length;

    case 'arrow-table':
    default:
      return table.data.numCols;
  }
}

/** Get a table cell value at row index and column name */
export function getTableCell(table: Table, rowIndex: number, columnName: string): unknown {
  switch (table.shape) {
    case 'array-row-table':
      const columnIndex = getTableColumnIndex(table, columnName);
      return table.data[rowIndex][columnIndex];

    case 'object-row-table':
    case 'geojson-row-table':
      return table.data[rowIndex][columnName];

    case 'columnar-table':
      const column = table.data[columnName];
      return column[rowIndex];

    case 'arrow-table':
      return table.data.getChild(columnName)?.get(rowIndex);

    default:
      throw new Error('todo');
  }
}

/** Get a table cell value at row index and column name */
export function getTableCellAt(table: Table, rowIndex: number, columnIndex: number): unknown {
  switch (table.shape) {
    case 'array-row-table':
      return table.data[rowIndex][columnIndex];

    case 'object-row-table':
    case 'geojson-row-table':
      let columnName = getTableColumnName(table, columnIndex);
      return table.data[rowIndex][columnName];

    case 'columnar-table':
      columnName = getTableColumnName(table, columnIndex);
      const column = table.data[columnName];
      return column[rowIndex];

    case 'arrow-table':
      return table.data.getChildAt(columnIndex)?.get(rowIndex);

    default:
      throw new Error('todo');
  }
}

/** Deduce the table row shape */
export function getTableRowShape(table: Table): 'array-row-table' | 'object-row-table' {
  switch (table.shape) {
    case 'array-row-table':
    case 'object-row-table':
      return table.shape;

    case 'geojson-row-table':
      return 'object-row-table';

    case 'columnar-table':
    default:
      throw new Error('Not a row table');
  }
}

/** Get the index of a named table column. Requires the table to have a schema */
export function getTableColumnIndex(table: Table, columnName: string): number {
  const columnIndex = table.schema?.fields.findIndex((field) => field.name === columnName);
  if (columnIndex === undefined) {
    throw new Error(columnName);
  }
  return columnIndex;
}

/** Get the name of a table column by index. Requires the table to have a schema */
export function getTableColumnName(table: Table, columnIndex: number): string {
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
export function getTableRowAsObject(
  table: Table,
  rowIndex: number,
  target?: {[columnName: string]: unknown},
  copy?: 'copy'
): {[columnName: string]: unknown} {
  switch (table.shape) {
    case 'object-row-table':
      return copy ? Object.fromEntries(Object.entries(table.data[rowIndex])) : table.data[rowIndex];
    case 'array-row-table':
      if (!table.schema) {
        throw new Error('no schema');
      }
      const objectRow: {[columnName: string]: unknown} = target || {};
      for (let i = 0; i < table.schema.fields.length; i++) {
        objectRow[table.schema.fields[i].name] = table.data[rowIndex][i];
      }
      return objectRow;
    default:
      throw new Error(table.shape);
  }
}

/**
 * Returns one row of the table in array format.
 * @param target Optional parameter will be used if needed to store the row. Can be reused between calls to improve performance.
 * @returns an array representing the row. May be the original array in the row, a new object, or the target parameter
 */
export function getTableRowAsArray(
  table: Table,
  rowIndex: number,
  target?: unknown[],
  copy?: 'copy'
): unknown[] {
  switch (table.shape) {
    case 'array-row-table':
      return copy ? Array.from(table.data[rowIndex]) : table.data[rowIndex];
    // case 'object-row-table':
    //   if (!table.schema) {
    //     throw new Error('no schema');
    //   }
    //   const arrayRow: unknown[] = target || [];
    //   for (let i = 0; i < table.schema.fields.length; i++) {
    //     arrayRow[i] = table.data[rowIndex][table.schema.fields[i].name];
    //   }
    //   return arrayRow;
    default:
      if (!table.schema) {
        throw new Error('no schema');
      }
      const arrayRow: unknown[] = target || [];
      const numCols = getTableNumCols(table);
      arrayRow.length = numCols;
      for (let columnIndex = 0; columnIndex < numCols; ++columnIndex) {
        arrayRow[columnIndex] = getTableRowAsArray(table, rowIndex, [], 'copy');
      }
      return arrayRow;
  }
}

/** Convert any table into array row format */
export function makeArrayRowTable(table: Table): ArrayRowTable {
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
export function makeObjectRowTable(table: Table): ObjectRowTable {
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
