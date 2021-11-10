import type {Schema} from '../schema/schema';
import type {TableBatch} from '../../category/table/table-types';
// import type {ArrayRowTableBatch, ObjectRowTableBatch} from '../../category/table';
import {convertToArrayRow, convertToObjectRow} from '../utils/row-utils';
import {TableBatchAggregator, TableBatchOptions} from './table-batch-aggregator';

const DEFAULT_ROW_COUNT = 100;

export default class RowTableBatchAggregator implements TableBatchAggregator {
  schema: Schema;
  options: TableBatchOptions;

  length: number = 0;
  objectRows: {[columnName: string]: any} | null = null;
  arrayRows: any[] | null = null;
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
      schema: this.schema,
      cursor: this.cursor
    };
  }
}
