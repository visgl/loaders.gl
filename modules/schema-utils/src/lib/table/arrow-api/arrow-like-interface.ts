// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataType} from './arrow-like-type';

/**
 * ArrowJS `Field` API-compatible class for row-based tables
 * https://loaders.gl/arrowjs/docs/api-reference/field
 * A field holds name, nullable, and metadata information about a table "column"
 * A Schema is essentially a list of fields
 */
export interface Field {
  name: string;
  type: DataType;
  nullable: boolean;
  metadata: Map<string, string>;

  // constructor(
  //   name: string,
  //   type: DataType,
  //   nullable?,
  //   metadata?
  // );

  typeId(): number;

  clone(): Field;

  compareTo(other: this): boolean;

  toString();
}

export interface Schema {
  fields: Field[];
  metadata: Map<string, string>;

  // constructor(
  //   fields: Field[]  ,
  //   metadata: Map<string, string>
  // )

  // TODO - arrow only seems to compare fields, not metadata
  compareTo(other: Schema): boolean;

  select(...columnNames: string[]): Schema;

  selectAt(...columnIndices: number[]): Schema;

  assign(schemaOrFields: Schema | Field[]): Schema;
}

export interface ArrowLikeVector {
  table: Table;
  columnName: string;

  // constructor(table: Table, columnName: string);

  get(rowIndex: number): unknown;
  toArray(): ArrayLike<unknown>;
}

/**
 * Class that provides an API similar to Apache Arrow Table class
 * Forwards methods directly if the underlying table is Arrow, otherwise calls accessor functions
 */
export interface Table {
  schema: Schema;

  // constructor(table: Table);

  data: any;

  numCols: number;

  length(): number;

  getChild(columnName: string): ArrowLikeVector;

  // getChildAt(columnIndex: number): ArrowLikeVector {
  //   return
  // }
}
