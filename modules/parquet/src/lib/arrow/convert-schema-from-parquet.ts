// loaders.gl, MIT license

import type {ParquetSchema} from '../../parquetjs/schema/schema';
import type {FieldDefinition, ParquetField, ParquetType} from '../../parquetjs/schema/declare';
import {FileMetaData} from '@loaders.gl/parquet/parquetjs/parquet-thrift';

import {
  Schema,
  Struct,
  Field,
  DataType,
  Bool,
  Float64,
  Int32,
  Float32,
  Binary,
  Utf8,
  Int64,
  Uint16,
  Uint32,
  Uint64,
  Int8,
  Int16
} from '@loaders.gl/schema';

export const PARQUET_TYPE_MAPPING: {[type in ParquetType]: typeof DataType} = {
  BOOLEAN: Bool,
  INT32: Int32,
  INT64: Float64,
  INT96: Float64,
  FLOAT: Float32,
  DOUBLE: Float64,
  BYTE_ARRAY: Binary,
  FIXED_LEN_BYTE_ARRAY: Binary,
  UTF8: Utf8,
  DATE: Int32,
  TIME_MILLIS: Int64,
  TIME_MICROS: Int64,
  TIMESTAMP_MILLIS: Int64,
  TIMESTAMP_MICROS: Int64,
  UINT_8: Int32,
  UINT_16: Uint16,
  UINT_32: Uint32,
  UINT_64: Uint64,
  INT_8: Int8,
  INT_16: Int16,
  INT_32: Int32,
  INT_64: Int64,
  JSON: Binary,
  BSON: Binary,
  // TODO check interval type
  INTERVAL: Binary,
  DECIMAL_INT32: Float32,
  DECIMAL_INT64: Float64,
  DECIMAL_BYTE_ARRAY: Float64,
  DECIMAL_FIXED_LEN_BYTE_ARRAY: Float64
};

export function convertSchemaFromParquet(parquetSchema: ParquetSchema, parquetMetadata?: FileMetaData): Schema {
  const fields = getFields(parquetSchema.schema);
  const metadata = parquetMetadata && getSchemaMetadata(parquetMetadata);
  return new Schema(fields, metadata);
}

function getFields(schema: FieldDefinition): Field[] {
  const fields: Field[] = [];

  for (const name in schema) {
    const field = schema[name];

    if (field.fields) {
      const childFields = getFields(field.fields);
      const nestedField = new Field(name, new Struct(childFields), field.optional);
      fields.push(nestedField);
    } else {
      const FieldType = PARQUET_TYPE_MAPPING[field.type];
      const metadata = getFieldMetadata(field);
      const arrowField = new Field(name, new FieldType(), field.optional, metadata);
      fields.push(arrowField);
    }
  }

  return fields;
}

function getFieldMetadata(field: ParquetField): Map<string, string> {
  const metadata = new Map();

  for (const key in field) {
    if (key !== 'name') {
      let value = field[key] || '';
      value = typeof field[key] !== 'string' ? JSON.stringify(field[key]) : field[key];
      metadata.set(key, value);
    }
  }

  return metadata;
}

function getSchemaMetadata(parquetMetadata: FileMetaData): Map<string, string> {
  const metadata = new Map();

  const keyValueList = parquetMetadata.key_value_metadata || [];
  for (const {key, value} of keyValueList) {
    if (typeof value === 'string') {
      metadata.set(key, value);
    }
  }

  return metadata;
}
