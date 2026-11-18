// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {snapshotArrowSchema} from '../../arrow/arrow-metadata';
import type {Schema} from '@loaders.gl/core/schema';
import * as arrow from 'apache-arrow';
import {
  convertArrowToSchema,
  convertSchemaToArrow,
  type ArrowSchemaConversionOptions
} from '../../schema/convert-arrow-schema';

/** Options for constructing Arrow tables from loaders.gl rows. */
export type ArrowTableBuilderOptions = ArrowSchemaConversionOptions;

/** Builds an arrow table or batches */
export class ArrowTableBuilder {
  schema: Schema;
  arrowSchema: arrow.Schema;
  arrowBuilders: arrow.Builder[];
  length: number;

  constructor(schema: Schema, options?: ArrowTableBuilderOptions) {
    this.arrowSchema = convertSchemaToArrow(schema, options);
    this.schema =
      options?.viewTypes && options.viewTypes !== 'never'
        ? convertArrowToSchema(this.arrowSchema)
        : schema;
    this.arrowBuilders = this.arrowSchema.fields.map(field =>
      arrow.makeBuilder({type: field.type, nullValues: [null, undefined]})
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

  /** Emits the declared schema before any rows are buffered. */
  firstBatch(): arrow.RecordBatch | null {
    return this.length === 0 ? this._getArrowRecordBatch() : null;
  }

  /** Flushes the buffered rows as a native record batch. */
  flushBatch(): arrow.RecordBatch | null {
    return this.length === 0 ? null : this._getArrowRecordBatch();
  }

  /** Finishes the builders and returns the final native batch when it has rows or fields. */
  finishBatch(): arrow.RecordBatch | null {
    const batch = this._getArrowRecordBatch();
    this.arrowBuilders.forEach(builder => builder.finish());
    return batch.numCols || batch.numRows ? batch : null;
  }

  /** Finishes the builders and returns a native Arrow table. */
  finishTable(): arrow.Table {
    const batch = this._getArrowRecordBatch();
    this.arrowBuilders.forEach(builder => builder.finish());
    return new arrow.Table(batch);
  }

  /** Extract a record batch flushing the currently accumulated data in the builders */
  _getArrowRecordBatch(): arrow.RecordBatch {
    const {arrowBuilders, arrowSchema} = this;
    const arrowDatas = arrowBuilders.map(builder => builder.flush());
    const length = arrowDatas[0]?.length || this.length;
    this.length = 0;
    const structField = new arrow.Struct(arrowSchema.fields);
    const arrowStructData = new arrow.Data(structField, 0, length, 0, undefined, arrowDatas);
    const arrowRecordBatch = new arrow.RecordBatch(
      snapshotArrowSchema(arrowSchema),
      arrowStructData
    );
    return arrowRecordBatch;
  }
}
