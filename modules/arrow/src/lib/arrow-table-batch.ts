import type {ArrowTableBatch} from '@loaders.gl/schema';
import {
  Schema,
  Field,
  RecordBatch,
  Struct,
  makeVector,
  makeData,
  Vector,
  Float32
} from 'apache-arrow';
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
      const recordBatch = new RecordBatch(
        this.arrowSchema,
        makeData({
          type: new Struct(this.arrowSchema.fields),
          children: arrowVectors.map(({data}) => data[0])
        })
      );

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
function getArrowSchema(schema): Schema {
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
function getArrowVectors(arrowSchema, data): Vector[] {
  const arrowVectors: any[] = [];
  for (const field of arrowSchema.fields) {
    const vector = data[field.name];
    if (vector instanceof Float32Array) {
      const arrowVector = makeVector(vector);
      arrowVectors.push(arrowVector);
    }
  }
  if (arrowSchema.fields.length !== arrowVectors.length) {
    throw new Error('Some columns not arrow convertible');
  }
  return arrowVectors;
}
