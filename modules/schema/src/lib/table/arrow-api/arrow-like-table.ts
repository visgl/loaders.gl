// loaders.gl, MIT license

import {Table} from '../../../types/category-table';

import {ArrowLikeSchema} from './arrow-like-schema';

import {deduceTableSchema} from '../utilities/deduce-table-schema';

import {
  getTableCell,
  getTableLength,
  getTableNumCols
  // getTableCell,
  // getTableRowShape,
  // getTableColumnIndex,
  // getTableColumnName,
  // getTableRowAsObject,
  // getTableRowAsArray
} from '../utilities/table-accessors';

class ArrowLikeVector {
  table: Table;
  columnName: string;

  constructor(table: Table, columnName: string) {
    this.table = table;
    this.columnName = columnName;
  }

  get(rowIndex: number): unknown {
    return getTableCell(this.table, rowIndex, this.columnName);
  }

  toArray(): ArrayLike<unknown> {
    switch (this.table.shape) {
      case 'arrow-table':
        return this.table.data.getChild(this.columnName)?.toArray();
      case 'columnar-table':
        return this.table.data[this.columnName];
      default:
        throw new Error(this.table.shape);
    }
  }
}

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

  getChild(columnName: string): ArrowLikeVector {
    return new ArrowLikeVector(this.table, columnName);
  }

  // getChildAt(columnIndex: number): ArrowLikeVector {
  //   return
  // }
}
