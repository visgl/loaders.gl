import {Table, ArrayRowTable, ObjectRowTable} from '../../../types/category-table';
import { deduceTableSchema } from './deduce-table-schema';

/** Helper that wraps an array a loaders.gl Table object and deduces shape and schema */
export function makeTableFromArray(
  array: unknown[], 
  defaultShape: 'array-row-table' | 'object-row-table' = 'array-row-table'
):  ArrayRowTable | ObjectRowTable {
  if (array.length === 0) {
    return {shape: defaultShape, schema: {fields: [], metadata: {}}, data: []};
  }

  // Deduce the table shape from the first row
  const firstRow = array[0];
  if (firstRow && typeof firstRow === 'object') {
    const table: Table = {shape: 'object-row-table', data: array as {[key: string]: unknown}[]};
    const schema = deduceTableSchema(table);
    return {...table, schema};
  }
  if (Array.isArray(firstRow)) {
    const table: Table = {shape: 'array-row-table', data: array as unknown[][]};
    const schema = deduceTableSchema(table);
    return {...table, schema};
  }

  throw new Error('invalid table');
}