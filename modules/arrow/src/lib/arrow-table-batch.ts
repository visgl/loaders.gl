import type {ArrowTableBatch} from '@loaders.gl/schema';
import {Schema, Field, RecordBatch, Float32Vector, Float32} from 'apache-arrow/Arrow.node';
import {ColumnarTableBatchAggregator} from '@loaders.gl/schema';

export default class ArrowTableBatchAggregator extends ColumnarTableBatchAggregator {
  arrowSchema: Schema | null;

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
      // new RecordBatch(schema, numRows, vectors, ...);
      const recordBatch = new RecordBatch(this.arrowSchema, batch.length, arrowVectors);
      return {
        shape: 'arrow-table',
        batchType: 'data',
        data: recordBatch,
        length: batch.length
      };
    }

    return null;
  }
}

// Convert from a simple loaders.gl schema to an Arrow schema
function getArrowSchema(schema) {
  const arrowFields: Field[] = [];
  for (const key in schema) {
    const field = schema[key];
    if (field.type === Float32Array) {
      const metadata = field; // just store the original field as metadata
      // arrow: new Field(name, nullable, metadata)
      const arrowField = new Field(field.name, new Float32(), field.nullable, metadata);
      arrowFields.push(arrowField);
    }
  }
  if (arrowFields.length === 0) {
    throw new Error('No arrow convertible fields');
  }

  return new Schema(arrowFields);
}

// Convert from simple loaders.gl arrays to arrow vectors
function getArrowVectors(arrowSchema, data) {
  const arrowVectors: any[] = [];
  for (const field of arrowSchema.fields) {
    const vector = data[field.name];
    if (vector instanceof Float32Array) {
      const arrowVector = Float32Vector.from(vector);
      arrowVectors.push(arrowVector);
    }
  }
  if (arrowSchema.fields.length !== arrowVectors.length) {
    throw new Error('Some columns not arrow convertible');
  }
  return arrowVectors;
}
