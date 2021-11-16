import type {Schema} from '../schema/schema';
import type {TableBatch} from '../../category/table/table-types';
import {TableBatchAggregator, TableBatchOptions} from './table-batch-aggregator';

const DEFAULT_ROW_COUNT = 100;

export default class RowTableBatchAggregator implements TableBatchAggregator {
  schema: Schema;
  options: TableBatchOptions;

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

    this.rows = this.rows || new Array(DEFAULT_ROW_COUNT);
    this.rows[this.length] = row;
    this.length++;
  }

  addObjectRow(row: {[columnName: string]: any}, cursor?: number): void {
    if (Number.isFinite(cursor)) {
      this.cursor = cursor as number;
    }

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
      shape: this.options.shape,
      batchType: 'data',
      data: rows,
      length: this.length,
      schema: this.schema,
      cursor: this.cursor
    };

    return batch;
  }
}
