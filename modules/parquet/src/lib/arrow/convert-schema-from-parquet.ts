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
  INT64: 'int64',
  INT96: 'float64',
  FLOAT: 'float32',
  DOUBLE: 'float64',
  BYTE_ARRAY: 'binary',
  FIXED_LEN_BYTE_ARRAY: 'binary',
  UTF8: 'utf8',
  ENUM: 'utf8',
  DATE: 'date-day',
  TIME_MILLIS: 'time-millisecond',
  TIME_MICROS: 'time-microsecond',
  TIME_NANOS: 'time-nanosecond',
  TIMESTAMP_MILLIS: 'timestamp-millisecond',
  TIMESTAMP_MICROS: 'timestamp-microsecond',
  TIMESTAMP_NANOS: 'timestamp-nanosecond',
  UINT_8: 'uint8',
  UINT_16: 'uint16',
  UINT_32: 'uint32',
  UINT_64: 'uint64',
  INT_8: 'int8',
  INT_16: 'int16',
  INT_32: 'int32',
  INT_64: 'int64',
  UUID: {type: 'fixed-size-binary', byteWidth: 16},
  FLOAT16: 'float16',
  UNKNOWN: 'null',
  VARIANT: 'binary',
  GEOMETRY: 'binary',
  GEOGRAPHY: 'binary',
  JSON: 'binary',
  BSON: 'binary',
  // TODO check interal type
  INTERVAL: 'binary',
  DECIMAL_INT32: {type: 'decimal', bitWidth: 128, precision: 38, scale: 0},
  DECIMAL_INT64: {type: 'decimal', bitWidth: 128, precision: 38, scale: 0},
  DECIMAL_BYTE_ARRAY: {type: 'decimal', bitWidth: 128, precision: 38, scale: 0},
  DECIMAL_FIXED_LEN_BYTE_ARRAY: {type: 'decimal', bitWidth: 128, precision: 38, scale: 0}
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
  const elementField: Field = {
    name,
    type: getFieldValueType(field),
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

/** Converts a nested Parquet definition into its corresponding Arrow data type. */
function getFieldValueType(field: FieldDefinition): DataType {
  if (!field.fields) {
    return getFieldType(field);
  }

  if (field.logicalType?.type === 'LIST') {
    const element = field.fields.list?.fields?.element || field.fields.element;
    if (!element) {
      // Preserve unusual legacy LIST layouts as structs. Their group names and
      // repetition levels are still available to the row-materialization path.
      return {type: 'struct', children: getFields(field.fields)};
    }
    if (
      (element.logicalType?.type === 'LIST' &&
        (!isStandardListDefinition(element) || element.optional !== false)) ||
      (element.logicalType?.type === 'MAP' &&
        (!isStandardMapDefinition(element) || element.optional !== false))
    ) {
      // Preserve nested legacy wrappers. Arrow's high-level List/Map type
      // cannot describe the historical wrapper shape without changing the
      // object-row contract used by existing callers.
      return {type: 'struct', children: getFields(field.fields)};
    }
    return {
      type: 'list',
      children: [
        {
          name: 'element',
          type: getFieldValueType(element),
          nullable: Boolean(element.optional)
        }
      ]
    };
  }

  if (field.logicalType?.type === 'MAP') {
    const entry = field.fields.key_value?.fields || field.fields;
    const key = entry?.key;
    const value = entry?.value;
    if (!key || !value) {
      // Preserve unusual legacy MAP layouts as structs rather than rejecting a
      // file whose converted annotation does not follow the standard wrapper.
      return {type: 'struct', children: getFields(field.fields)};
    }
    return {
      type: 'map',
      keysSorted: false,
      children: [
        {
          name: 'entries',
          type: {
            type: 'struct',
            children: [
              {name: 'key', type: getFieldValueType(key), nullable: false},
              {name: 'value', type: getFieldValueType(value), nullable: Boolean(value.optional)}
            ]
          },
          nullable: false
        }
      ]
    };
  }

  return {type: 'struct', children: getFields(field.fields)};
}

/** Returns whether a nested LIST follows the standard list/list/element wrapper. */
function isStandardListDefinition(field: FieldDefinition): boolean {
  return Boolean(field.fields?.list?.fields?.element);
}

/** Returns whether a nested MAP follows the standard map/key_value/key/value wrapper. */
function isStandardMapDefinition(field: FieldDefinition): boolean {
  return Boolean(field.fields?.key_value?.fields?.key && field.fields.key_value.fields.value);
}

/** Returns the exact serialized Arrow type for one decoded Parquet field. */
function getFieldType(field: FieldDefinition): DataType {
  if (field.logicalType?.type === 'DECIMAL') {
    const precision = field.precision ?? field.presision;
    const scale = field.scale;
    if (!precision || scale === undefined) {
      throw new Error('Parquet DECIMAL logical type requires precision and scale');
    }
    if (precision > 76) {
      throw new Error(`Parquet DECIMAL precision ${precision} exceeds Arrow Decimal256`);
    }
    return {type: 'decimal', bitWidth: precision <= 38 ? 128 : 256, precision, scale};
  }
  if (field.logicalType?.type === 'UUID') {
    return {type: 'fixed-size-binary', byteWidth: field.typeLength || 16};
  }
  return PARQUET_TYPE_MAPPING[field.type!];
}

/** Returns defined physical field properties as Arrow-compatible string metadata. */
function getFieldMetadata(field: FieldDefinition): Record<string, string> | undefined {
  let metadata: Record<string, string> | undefined;

  if (
    field.logicalType?.type === 'VARIANT' &&
    field.logicalType.specificationVersion !== undefined
  ) {
    metadata = {
      'parquet.variant.specification_version': String(field.logicalType.specificationVersion)
    };
  }

  for (const key in field) {
    const fieldValue = field[key];
    if (
      key === 'name' ||
      key === 'fields' ||
      (key === 'physicalType' && fieldValue === field.type) ||
      (key === 'presision' && field.precision !== undefined) ||
      fieldValue === undefined
    ) {
      continue;
    }
    const metadataValue =
      typeof fieldValue === 'string'
        ? fieldValue
        : typeof fieldValue === 'boolean'
          ? fieldValue
            ? 'true'
            : 'false'
          : JSON.stringify(fieldValue);
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
