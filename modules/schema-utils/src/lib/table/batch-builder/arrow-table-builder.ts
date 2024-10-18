// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import {convertSchemaToArrow} from '@loaders.gl/schema-utils';

/** Builds an arrow table or batches */
export class ArrowTableBuilder {
  schema: Schema;
  arrowSchema: arrow.Schema;
  arrowBuilders: arrow.Builder[];
  length: number;

  constructor(schema: Schema) {
    this.schema = schema;
    this.arrowSchema = convertSchemaToArrow(schema);
    this.arrowBuilders = this.arrowSchema.fields.map((field) =>
      arrow.makeBuilder({type: field.type, nullValues: [null]})
    );
    this.length = 0;
  }

  addObjectRow(row: {[key: string]: any}) {
    for (let i = 0; i < this.arrowBuilders.length; i++) {
      const columnName = this.schema.fields[i].name;
      const value = row[columnName];
      // if (this.schema.fields[i].type.toString() === 'bool') {
      //   debugger;
      // }
      this.arrowBuilders[i].append(value);
    }
    this.length++;
  }

  addArrayRow(row: any[]) {
    for (let i = 0; i < this.arrowBuilders.length; i++) {
      this.arrowBuilders[i].append(row[i]);
    }
    this.length++;
  }

  /** Makes sure that a first batch with schema is sent even if no rows */
  firstBatch(): ArrowTableBatch | null {
    const arrowRecordBatch = this._getArrowRecordBatch();
    // If there is data, a batch will be sent later
    if (arrowRecordBatch.numCols !== 0) {
      return null;
    }
    return {
      shape: 'arrow-table',
      batchType: 'data',
      length: arrowRecordBatch.numRows,
      schema: this.schema,
      data: new arrow.Table(arrowRecordBatch)
    };
  }

  /** Flush the current batch if conditions are right */
  flushBatch(): ArrowTableBatch | null {
    const arrowRecordBatch = this._getArrowRecordBatch();
    if (arrowRecordBatch.numCols === 0) {
      return null;
    }
    return {
      shape: 'arrow-table',
      batchType: 'data',
      length: arrowRecordBatch.numRows,
      schema: this.schema,
      data: new arrow.Table(arrowRecordBatch)
    };
  }

  /** Get a last batch if any data is left */
  finishBatch(): ArrowTableBatch | null {
    const arrowRecordBatch = this._getArrowRecordBatch();
    this.arrowBuilders.forEach((builder) => builder.finish());
    if (arrowRecordBatch.numCols === 0) {
      return null;
    }
    return {
      shape: 'arrow-table',
      batchType: 'data',
      length: arrowRecordBatch.numRows,
      schema: this.schema,
      data: new arrow.Table(arrowRecordBatch)
    };
  }

  /** Return a table with all the accumulated data */
  finishTable(): ArrowTable {
    const arrowRecordBatch = this._getArrowRecordBatch();
    this.arrowBuilders.forEach((builder) => builder.finish());
    return {
      shape: 'arrow-table',
      schema: this.schema,
      data: new arrow.Table(arrowRecordBatch)
    };
  }

  /** Extract a record batch flushing the currently accumulated data in the builders */
  _getArrowRecordBatch(): arrow.RecordBatch {
    const {arrowBuilders, arrowSchema} = this;
    const arrowDatas = arrowBuilders.map((builder) => builder.flush());
    arrowBuilders.forEach((builder) => builder.finish());

    const structField = new arrow.Struct(arrowSchema.fields);
    const arrowStructData = new arrow.Data(structField, 0, length, 0, undefined, arrowDatas);
    const arrowRecordBatch = new arrow.RecordBatch(arrowSchema, arrowStructData);
    return arrowRecordBatch;
  }
}
