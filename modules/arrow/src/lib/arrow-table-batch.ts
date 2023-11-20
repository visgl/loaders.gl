// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import {ColumnarTableBatchAggregator} from '@loaders.gl/schema';
import type {ArrowTableBatch} from './arrow-table';
import * as arrow from 'apache-arrow';

export class ArrowTableBatchAggregator extends ColumnarTableBatchAggregator {
  arrowSchema: arrow.Schema | null;

  constructor(schema, options) {
    super(schema, options);
    this.arrowSchema = null;
  }

  getBatch(): ArrowTableBatch | null {
    const batch = super.getBatch();
    if (batch) {
      // Get the arrow schema
      this.arrowSchema = this.arrowSchema || getArrowSchema(batch.schema);

      // Get arrow format vectors
      const arrowVectors = getArrowVectors(this.arrowSchema, batch.data);

      // Create the record batch
      const recordBatch = new arrow.RecordBatch(
        this.arrowSchema,
        arrow.makeData({
          type: new arrow.Struct(this.arrowSchema.fields),
          children: arrowVectors.map(({data}) => data[0])
        })
      );

      return {
        shape: 'arrow-table',
        batchType: 'data',
        data: new arrow.Table([recordBatch]),
        length: batch.length
      };
    }

    return null;
  }
}

// Convert from a simple loaders.gl schema to an Arrow schema
function getArrowSchema(schema): arrow.Schema {
  const arrowFields: arrow.Field[] = [];
  for (const key in schema) {
    const field = schema[key];
    if (field.type === Float32Array) {
      // TODO - just store the original field as metadata?
      const metadata = new Map(); // field;
      // arrow: new arrow.Field(name, nullable, metadata)
      const arrowField = new arrow.Field(field.name, new arrow.Float32(), field.nullable, metadata);
      arrowFields.push(arrowField);
    }
  }
  if (arrowFields.length === 0) {
    throw new Error('No arrow convertible fields');
  }

  return new arrow.Schema(arrowFields);
}

// Convert from simple loaders.gl arrays to arrow vectors
function getArrowVectors(arrowSchema, data): arrow.Vector[] {
  const arrowVectors: any[] = [];
  for (const field of arrowSchema.fields) {
    const vector = data[field.name];
    if (vector instanceof Float32Array) {
      const arrowVector = arrow.makeVector(vector);
      arrowVectors.push(arrowVector);
    }
  }
  if (arrowSchema.fields.length !== arrowVectors.length) {
    throw new Error('Some columns not arrow convertible');
  }
  return arrowVectors;
}
