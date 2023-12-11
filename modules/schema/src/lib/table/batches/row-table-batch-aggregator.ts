// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '../../../types/schema';
import type {TableBatch} from '../../../types/category-table';
import {TableBatchAggregator, TableBatchOptions} from './table-batch-aggregator';
import {
  convertToArrayRow,
  convertToObjectRow,
  inferHeadersFromArrayRow,
  inferHeadersFromObjectRow
} from '../simple-table/row-utils';

const DEFAULT_ROW_COUNT = 100;

export class RowTableBatchAggregator implements TableBatchAggregator {
  schema: Schema | null;
  options: TableBatchOptions;

  length: number = 0;
  objectRows: {[columnName: string]: unknown}[] | null = null;
  arrayRows: unknown[][] | null = null;
  cursor: number = 0;
  private _headers: string[] | null = null;

  constructor(schema: Schema | null, options: TableBatchOptions) {
    this.options = options;
    this.schema = schema;

    // schema is an array if there're no headers
    // object if there are headers
    if (schema) {
      this._headers = [];
      for (const key in schema) {
        this._headers[schema[key].index] = schema[key].name;
      }
    }
  }

  rowCount(): number {
    return this.length;
  }

  addArrayRow(row: any[], cursor?: number): void {
    if (Number.isFinite(cursor)) {
      this.cursor = cursor as number;
    }

    // TODO - infer schema at a higher level, instead of hacking headers here?
    this._headers ||= inferHeadersFromArrayRow(row);

    // eslint-disable-next-line default-case
    switch (this.options.shape) {
      case 'object-row-table':
        const rowObject = convertToObjectRow(row, this._headers);
        this.addObjectRow(rowObject, cursor);
        break;
      case 'array-row-table':
        this.arrayRows = this.arrayRows || new Array(DEFAULT_ROW_COUNT);
        this.arrayRows[this.length] = row;
        this.length++;
        break;
    }
  }

  addObjectRow(row: {[columnName: string]: any}, cursor?: number): void {
    if (Number.isFinite(cursor)) {
      this.cursor = cursor as number;
    }

    // TODO - infer schema at a higher level, instead of hacking headers here?
    this._headers ||= inferHeadersFromObjectRow(row);

    // eslint-disable-next-line default-case
    switch (this.options.shape) {
      case 'array-row-table':
        const rowArray = convertToArrayRow(row, this._headers);
        this.addArrayRow(rowArray, cursor);
        break;
      case 'object-row-table':
        this.objectRows = this.objectRows || new Array(DEFAULT_ROW_COUNT);
        this.objectRows[this.length] = row;
        this.length++;
        break;
    }
  }

  getBatch(): TableBatch | null {
    let rows = this.arrayRows || this.objectRows;
    if (!rows) {
      return null;
    }

    rows = rows.slice(0, this.length);
    this.arrayRows = null;
    this.objectRows = null;

    return {
      shape: this.options.shape,
      batchType: 'data',
      data: rows,
      length: this.length,
      // @ts-expect-error we should infer a schema
      schema: this.schema,
      cursor: this.cursor
    };
  }
}
