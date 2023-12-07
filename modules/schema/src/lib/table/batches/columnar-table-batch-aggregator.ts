// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '../../../types/schema';
import type {ColumnarTableBatch, ArrowTableBatch} from '../../../types/category-table';
import {TableBatchAggregator} from './table-batch-aggregator';

type ColumnarTableBatchOptions = {};

const DEFAULT_ROW_COUNT = 100;

export class ColumnarTableBatchAggregator implements TableBatchAggregator {
  schema: Schema;
  length: number = 0;
  allocated: number = 0;
  columns: {[columnName: string]: any[]} = {};

  constructor(schema: Schema, options: ColumnarTableBatchOptions) {
    this.schema = schema;
    this._reallocateColumns();
  }

  rowCount(): number {
    return this.length;
  }

  addArrayRow(row: any[]) {
    // If user keeps pushing rows beyond batch size, reallocate
    this._reallocateColumns();
    let i = 0;
    // TODO what if no csv header, columns not populated?
    for (const fieldName in this.columns) {
      this.columns[fieldName][this.length] = row[i++];
    }
    this.length++;
  }

  addObjectRow(row: {[columnName: string]: any}): void {
    // If user keeps pushing rows beyond batch size, reallocate
    this._reallocateColumns();
    for (const fieldName in row) {
      this.columns[fieldName][this.length] = row[fieldName];
    }
    this.length++;
  }

  getBatch(): ColumnarTableBatch | ArrowTableBatch | null {
    this._pruneColumns();
    const columns = Array.isArray(this.schema) ? this.columns : {};

    // schema is an array if there're no headers
    // object if there are headers
    // columns should match schema format
    if (!Array.isArray(this.schema)) {
      for (const fieldName in this.schema) {
        const field = this.schema[fieldName];
        columns[field.name] = this.columns[field.index];
      }
    }

    this.columns = {};

    const batch: ColumnarTableBatch = {
      shape: 'columnar-table',
      batchType: 'data',
      data: columns,
      schema: this.schema,
      length: this.length
    };

    return batch;
  }

  // HELPERS

  _reallocateColumns() {
    if (this.length < this.allocated) {
      return;
    }

    // @ts-ignore TODO
    this.allocated = this.allocated > 0 ? (this.allocated *= 2) : DEFAULT_ROW_COUNT;
    this.columns = {};

    for (const fieldName in this.schema) {
      const field = this.schema[fieldName];
      const ArrayType = field.type || Float32Array;
      const oldColumn = this.columns[field.index];

      if (oldColumn && ArrayBuffer.isView(oldColumn)) {
        // Copy the old data to the new array
        const typedArray = new ArrayType(this.allocated);
        typedArray.set(oldColumn);
        this.columns[field.index] = typedArray;
      } else if (oldColumn) {
        // Plain array
        oldColumn.length = this.allocated;
        this.columns[field.index] = oldColumn;
      } else {
        // Create new
        this.columns[field.index] = new ArrayType(this.allocated);
      }
    }
  }

  _pruneColumns() {
    for (const [columnName, column] of Object.entries(this.columns)) {
      this.columns[columnName] = column.slice(0, this.length);
    }
  }
}
