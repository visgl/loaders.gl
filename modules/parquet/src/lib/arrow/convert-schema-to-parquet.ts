// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {ParquetSchema} from '../../parquetjs/schema/schema';
import type {
  // FieldDefinition, ParquetField,
  ParquetType
} from '../../parquetjs/schema/declare';

import {
  Schema,
  // Struct,
  // Field,
  DataType
} from '@loaders.gl/schema';

export const PARQUET_TYPE_MAPPING: {[type in ParquetType]: DataType} = {
  BOOLEAN: 'bool',
  INT32: 'int32',
  INT64: 'float64',
  INT96: 'float64',
  FLOAT: 'float32',
  DOUBLE: 'float64',
  BYTE_ARRAY: 'binary',
  FIXED_LEN_BYTE_ARRAY: 'binary',
  UTF8: 'utf8',
  DATE: 'int32',
  TIME_MILLIS: 'int64',
  TIME_MICROS: 'int64',
  TIMESTAMP_MILLIS: 'int64',
  TIMESTAMP_MICROS: 'int64',
  UINT_8: 'int32',
  UINT_16: 'uint16',
  UINT_32: 'uint32',
  UINT_64: 'uint64',
  INT_8: 'int8',
  INT_16: 'int16',
  INT_32: 'int32',
  INT_64: 'int64',
  JSON: 'binary',
  BSON: 'binary',
  // TODO check interval type
  INTERVAL: 'binary',
  DECIMAL_INT32: 'float32',
  DECIMAL_INT64: 'float64',
  DECIMAL_BYTE_ARRAY: 'float64',
  DECIMAL_FIXED_LEN_BYTE_ARRAY: 'float64'
};

export function convertToParquetSchema(schema: Schema): Schema {
  const fields = []; // getFields(schema.fields);

  // TODO add metadata if needed.
  return {fields, metadata: {}};
}

// function getFields(schema: Field[]): Definition[] {
//   const fields: Field[] = [];

//   for (const name in schema) {
//     const field = schema[name];

//     // @ts-ignore
//     const children = field.children as DataType[];
//     if (children) {
//       const childField = getFields(field.fields);
//       const nestedField = new Field(name, new Struct(childField), field.optional);
//       fields.push(nestedField);
//     } else {
//       const FieldType = PARQUET_TYPE_MAPPING[field.type];
//       const metadata = getFieldMetadata(field);
//       const arrowField = new Field(name, new FieldType(), field.optional, metadata);
//       fields.push(arrowField);
//     }
//   }

//   return fields;
// }

// function getFieldMetadata(field: ParquetField): Map<string, string> {
//   const metadata = new Map();

//   for (const key in field) {
//     if (key !== 'name') {
//       const value = typeof field[key] !== 'string' ? JSON.stringify(field[key]) : field[key];
//       metadata.set(key, value);
//     }
//   }

//   return metadata;
// }
