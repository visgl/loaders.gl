// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table} from '../../../types/category-table';

import {ArrowLikeSchema} from './arrow-like-schema';

import {deduceTableSchema} from '../simple-table/table-schema';

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
} from '../simple-table/table-accessors';

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
        const arrowTable = this.table.data as any;
        return arrowTable.getChild(this.columnName)?.toArray();
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
    return this.table.shape === 'geojson-table' ? this.table.features : this.table.data;
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
