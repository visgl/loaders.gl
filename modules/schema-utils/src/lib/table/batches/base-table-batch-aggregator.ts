// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '../../../types/schema';
import type {TableBatch} from '../../../types/category-table';
import {TableBatchAggregator, TableBatchOptions} from './table-batch-aggregator';

const DEFAULT_ROW_COUNT = 100;

export class BaseTableBatchAggregator implements TableBatchAggregator {
  schema: Schema;
  options: TableBatchOptions;

  shape?: 'array-row-table' | 'object-row-table';
  length: number = 0;
  rows: any[] | null = null;
  cursor: number = 0;
  private _headers: string[] = [];

  constructor(schema: Schema, options: TableBatchOptions) {
    this.options = options;
    this.schema = schema;

    // schema is an array if there're no headers
    // object if there are headers
    if (!Array.isArray(schema)) {
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

    this.shape = 'array-row-table';

    this.rows = this.rows || new Array(DEFAULT_ROW_COUNT);
    this.rows[this.length] = row;
    this.length++;
  }

  addObjectRow(row: {[columnName: string]: any}, cursor?: number): void {
    if (Number.isFinite(cursor)) {
      this.cursor = cursor as number;
    }

    this.shape = 'object-row-table';

    this.rows = this.rows || new Array(DEFAULT_ROW_COUNT);
    this.rows[this.length] = row;
    this.length++;
  }

  getBatch(): TableBatch | null {
    let rows = this.rows;
    if (!rows) {
      return null;
    }

    rows = rows.slice(0, this.length);
    this.rows = null;

    const batch: TableBatch = {
      shape: this.shape || 'array-row-table',
      batchType: 'data',
      data: rows,
      length: this.length,
      schema: this.schema,
      cursor: this.cursor
    };

    return batch;
  }
}
