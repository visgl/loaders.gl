// loaders.gl, MIT license

import {Table} from '../table-types';

import {ArrowLikeSchema} from './arrow-like-schema';

import {deduceTableSchema} from '../utilities/deduce-table-schema';

import {
  getTableLength,
  getTableNumCols
  // getTableCell,
  // getTableRowShape,
  // getTableColumnIndex,
  // getTableColumnName,
  // getTableRowAsObject,
  // getTableRowAsArray
} from '../utilities/table-accessors';

/**
 * Class that provides an API similar to Apache Arrow Table class
 * Forwards methods directly if the underlying table is Arrow, otherwise calls accessor functions
 */
export class ArrowLikeTable {
  schema: ArrowLikeSchema;
  table: Table;

  constructor(table: Table) {
    const schema = table.schema || deduceTableSchema(table);
    this.schema = new ArrowLikeSchema(schema.fields, schema.metadata);
    this.table = {...table, schema};
  }

  // get schema() {
  //   return this.table.schema;
  // }

  get data() {
    return this.table.data;
  }

  get numCols(): number {
    return getTableNumCols(this.table);
  }

  get length(): number {
    return getTableLength(this.table);
  }
}
