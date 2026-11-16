// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {Table} from '@loaders.gl/core/schema';

import {ArrowLikeSchema} from './arrow-like-schema';
import {deduceTableSchema} from '../../schema/deduce-table-schema';

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
} from '../tables/table-accessors';

class ArrowLikeVector {
  table: Table | arrow.Table;
  columnName: string;

  constructor(table: Table | arrow.Table, columnName: string) {
    this.table = table;
    this.columnName = columnName;
  }

  get(rowIndex: number): unknown {
    return getTableCell(this.table, rowIndex, this.columnName);
  }

  toArray(): ArrayLike<unknown> {
    if (!('shape' in this.table)) return this.table.getChild(this.columnName)?.toArray();
    switch (this.table.shape) {
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
  table: Table | arrow.Table;

  constructor(table: Table | arrow.Table) {
    const schema =
      'shape' in table ? table.schema || deduceTableSchema(table) : deduceTableSchema(table);
    this.schema = new ArrowLikeSchema(schema.fields, schema.metadata);
    this.table = 'shape' in table ? {...table, schema} : table;
  }

  // get schema() {
  //   return this.table.schema;
  // }

  get data() {
    if (!('shape' in this.table)) return this.table;
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
