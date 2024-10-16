// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, ColumnarTableBatch, ArrowTableBatch, TypedArray} from '@loaders.gl/schema';
import {isTypedArray} from '@math.gl/types';
import {getArrayTypeFromDataType} from '../../schema/data-type';
import {TableBatchAggregator} from './table-batch-aggregator';
type ColumnarTableBatchOptions = {};

const DEFAULT_ROW_COUNT = 100;

export class ColumnarTableBatchAggregator implements TableBatchAggregator {
  schema: Schema;
  length: number = 0;
  allocated: number = 0;
  columns: Record<string, TypedArray | Array<any>> = {};

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

    const batch: ColumnarTableBatch = {
      shape: 'columnar-table',
      batchType: 'data',
      data: this.columns,
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

    for (const field of this.schema.fields) {
      const ArrayType = getArrayTypeFromDataType(field.type, field.nullable);
      const oldColumn = this.columns[field.name];

      if (!oldColumn) {
        // Create new
        this.columns[field.name] = new ArrayType(this.allocated);
      } else if (Array.isArray(oldColumn)) {
        // Plain array, just increase its size
        oldColumn.length = this.allocated;
      } else if (isTypedArray(oldColumn)) {
        const typedArray = new ArrayType(this.allocated) as TypedArray;
        // Copy the old data to the new array
        typedArray.set(oldColumn);
        this.columns[field.name] = typedArray;
      } else {
        throw new Error('Invalid column type');
      }
    }
  }

  _pruneColumns() {
    for (const [columnName, column] of Object.entries(this.columns)) {
      this.columns[columnName] = column.slice(0, this.length);
    }
  }
}
