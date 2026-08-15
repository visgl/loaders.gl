// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema, Field, DataType} from '@loaders.gl/schema';

import type {ParquetSchema} from '../../parquetjs/schema/schema';
import type {FieldDefinition, ParquetType, SchemaDefinition} from '../../parquetjs/schema/declare';
import {FileMetaData} from '../../parquetjs/parquet-thrift';

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
  // TODO check interal type
  INTERVAL: 'binary',
  DECIMAL_INT32: 'float32',
  DECIMAL_INT64: 'float64',
  DECIMAL_BYTE_ARRAY: 'float64',
  DECIMAL_FIXED_LEN_BYTE_ARRAY: 'float64'
};

export function convertParquetSchema(
  parquetSchema: ParquetSchema,
  parquetMetadata: FileMetaData | null
): Schema {
  const fields = getFields(parquetSchema.schema);
  const metadata = parquetMetadata && getSchemaMetadata(parquetMetadata);

  const schema: Schema = {
    fields,
    metadata: metadata || {}
  };

  return schema;
}

function getFields(schema: SchemaDefinition): Field[] {
  const fields: Field[] = [];

  for (const name in schema) {
    fields.push(getField(name, schema[name]));
  }

  return fields;
}

/** Converts one Parquet field, preserving repeated values as Arrow lists. */
function getField(name: string, field: FieldDefinition): Field {
  const elementField: Field = field.fields
    ? {
        name,
        type: {type: 'struct', children: getFields(field.fields)},
        nullable: Boolean(field.optional)
      }
    : {
        name,
        type: PARQUET_TYPE_MAPPING[field.type!],
        nullable: Boolean(field.optional),
        metadata: getFieldMetadata(field)
      };

  if (!field.repeated) {
    return elementField;
  }

  return {
    name,
    type: {
      type: 'list',
      children: [{...elementField, name: 'element', nullable: false}]
    },
    nullable: Boolean(field.optional),
    metadata: elementField.metadata
  };
}

/** Returns defined physical field properties as Arrow-compatible string metadata. */
function getFieldMetadata(field: FieldDefinition): Record<string, string> | undefined {
  let metadata: Record<string, string> | undefined;

  for (const key in field) {
    const fieldValue = field[key];
    if (key === 'name' || fieldValue === undefined) {
      continue;
    }
    const metadataValue = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
    if (metadataValue === undefined) {
      continue;
    }
    metadata ||= {};
    metadata[key] = metadataValue;
  }

  return metadata;
}

function getSchemaMetadata(parquetMetadata: FileMetaData): Record<string, string> | undefined {
  let metadata: Record<string, string> | undefined;

  const keyValueList = parquetMetadata.key_value_metadata || [];
  for (const {key, value} of keyValueList) {
    if (typeof value === 'string') {
      metadata = metadata || {};
      metadata[key] = value;
    }
  }

  return metadata;
}
