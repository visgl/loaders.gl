import type {Mesh} from './mesh-types';
import {makeMeshAttributeMetadata, TypedArray} from '@loaders.gl/schema';
import {
  Table,
  Schema,
  RecordBatch,
  Int8,
  Uint8,
  Int16,
  Uint16,
  Int32,
  Uint32,
  Float32,
  Float64,
  FixedSizeList,
  Field,
  DataType,
  Data,
  Int8Vector,
  Uint8Vector,
  Int16Vector,
  Uint16Vector,
  Int32Vector,
  Uint32Vector,
  Float32Vector,
  Float64Vector,
  FixedSizeListVector
} from 'apache-arrow';
import {AbstractVector} from 'apache-arrow/vector';

/**
 * * Convert a loaders.gl Mesh to an Apache Arrow Table
 * @param mesh
 * @param metadata
 * @param batchSize
 * @returns
 */
export function convertMeshToArrowTable(
  mesh: Mesh,
  metadata?: Map<string, string>,
  batchSize?: number
): Table {
  const vectors: AbstractVector[] = [];
  const fields: Field[] = [];
  for (const attributeKey in mesh.attributes) {
    const attribute = mesh.attributes[attributeKey];
    const {value} = attribute;
    const type = getType(value);
    const vector = getVector(value);
    const listType = new FixedSizeList(value.length, new Field('value', type));
    const field = new Field(attributeKey, listType, false, makeMeshAttributeMetadata(attribute));
    const data = new Data(listType, 0, 1, 0, undefined, [vector]);
    const listVector = new FixedSizeListVector(data);
    vectors.push(listVector);
    fields.push(field);
  }
  const schema = new Schema(fields, metadata || new Map<string, string>());
  const recordBatch = new RecordBatch(schema, 1, vectors);
  const table = new Table(schema, recordBatch);
  return table;
}

function getType(array: TypedArray): DataType {
  switch (array.constructor) {
    case Int8Array:
      return new Int8();
    case Uint8Array:
      return new Uint8();
    case Int16Array:
      return new Int16();
    case Uint16Array:
      return new Uint16();
    case Int32Array:
      return new Int32();
    case Uint32Array:
      return new Uint32();
    case Float32Array:
      return new Float32();
    case Float64Array:
      return new Float64();
    default:
      throw new Error('array type not supported');
  }
}

function getVector(array: TypedArray): AbstractVector {
  switch (array.constructor) {
    case Int8Array:
      return Int8Vector.from(array);
    case Uint8Array:
      return Uint8Vector.from(array);
    case Int16Array:
      return Int16Vector.from(array);
    case Uint16Array:
      return Uint16Vector.from(array);
    case Int32Array:
      return Int32Vector.from(array);
    case Uint32Array:
      return Uint32Vector.from(array);
    case Float32Array:
      return Float32Vector.from(array);
    case Float64Array:
      return Float64Vector.from(array);
    default:
      throw new Error('array type not supported');
  }
}
