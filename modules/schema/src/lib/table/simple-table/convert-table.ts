// loaders.gl, MIT license
import {
  getTableCell,
  getTableLength,
  getTableRowAsArray,
  getTableRowAsObject
} from './table-accessors';
import {Table, ArrayRowTable, ObjectRowTable, ColumnarTable} from '../../../types/category-table';
import {deduceTableSchema} from './table-schema';
import {makeColumnFromField} from './table-column';

/** Convert any simple table into columnar format */
export function makeColumnarTable(table: Table): ColumnarTable {
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
export function makeArrayRowTable(table: Table): ArrayRowTable {
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
