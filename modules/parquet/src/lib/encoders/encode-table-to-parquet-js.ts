// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataType, Field, ObjectRowTable, Schema, Table} from '@loaders.gl/schema';
import {concatUint8Arrays} from '../../parquetjs/utils/binary-utils';
import {ParquetEncoder} from '../../parquetjs/encoder/parquet-encoder';
import {ParquetSchema} from '../../parquetjs/schema/schema';
import type {FieldDefinition, SchemaDefinition} from '../../parquetjs/schema/declare';
import type {ParquetJSWriterOptions} from '../../parquet-js-writer';

/** Encode a plain loaders.gl table with the parquetjs implementation. */
export async function encodeTableToParquetJs(
  table: Table,
  objectRowTable: ObjectRowTable,
  options: ParquetJSWriterOptions
): Promise<ArrayBuffer> {
  const parquetSchema = new ParquetSchema(
    convertSchemaToParquetSchema(table.schema!, objectRowTable)
  );
  const chunks: Uint8Array[] = [];
  const outputStream = {
    write(chunk: Uint8Array, callback: (error?: Error) => void) {
      chunks.push(chunk.slice());
      callback();
    },
    close(callback: (error?: Error) => void) {
      callback();
    }
  };

  const encoder = await ParquetEncoder.openStream(
    parquetSchema,
    outputStream as any,
    options.parquet
  );

  for (const [key, value] of Object.entries(table.schema?.metadata || {})) {
    encoder.setMetadata(key, value);
  }

  for (const row of objectRowTable.data) {
    await encoder.appendRow(row);
  }

  await encoder.close();

  return concatUint8Arrays(chunks).slice().buffer;
}

/**
 * Converts a loaders.gl schema into a parquetjs schema definition.
 * @param schema table schema
 * @param objectRowTable table data in object-row form
 * @returns parquetjs schema definition
 */
function convertSchemaToParquetSchema(
  schema: Schema,
  objectRowTable: ObjectRowTable
): SchemaDefinition {
  const parquetFields: SchemaDefinition = {};

  for (const field of schema.fields) {
    parquetFields[field.name] = convertFieldToParquetFieldDefinition(field, objectRowTable.data);
  }

  return parquetFields;
}

/**
 * Converts one loaders.gl field to the closest parquetjs field definition.
 * @param field table field metadata
 * @param rows object rows used for nullability and fallback inference
 * @returns parquetjs field definition
 */
function convertFieldToParquetFieldDefinition(
  field: Field,
  rows: Array<Record<string, unknown>>
): FieldDefinition {
  const sampleValue = getFirstDefinedValue(rows, field.name);
  const nullable = field.nullable ?? sampleValue === undefined;
  const dataType = field.type === 'null' ? getDataTypeFromValue(sampleValue) : field.type;

  switch (dataType) {
    case 'bool':
      return {type: 'BOOLEAN', optional: nullable};

    case 'int':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'uint8':
    case 'uint16':
    case 'uint32':
      return {type: 'INT32', optional: nullable};

    case 'int64':
    case 'uint64':
      return {type: 'INT64', optional: nullable};

    case 'float':
    case 'float16':
    case 'float32':
      return {type: 'FLOAT', optional: nullable};

    case 'float64':
      return {type: 'DOUBLE', optional: nullable};

    case 'utf8':
      return {type: 'UTF8', optional: nullable};

    case 'binary':
      return {type: 'BYTE_ARRAY', optional: nullable};

    case 'date-day':
      return {type: 'DATE', optional: nullable};

    case 'date-millisecond':
    case 'timestamp-second':
    case 'timestamp-millisecond':
      return {type: 'TIMESTAMP_MILLIS', optional: nullable};

    case 'timestamp-microsecond':
    case 'timestamp-nanosecond':
      return {type: 'TIMESTAMP_MICROS', optional: nullable};

    case 'time-second':
    case 'time-millisecond':
      return {type: 'TIME_MILLIS', optional: nullable};

    case 'time-microsecond':
    case 'time-nanosecond':
      return {type: 'TIME_MICROS', optional: nullable};

    default:
      if (typeof dataType === 'object' && dataType.type === 'fixed-size-binary') {
        return {
          type: 'FIXED_LEN_BYTE_ARRAY',
          typeLength: dataType.byteWidth,
          optional: nullable
        };
      }

      throw new Error(
        `ParquetJSWriter: Unsupported field "${field.name}" with type ${formatDataType(dataType)}`
      );
  }
}

/**
 * Finds the first non-nullish value in a column.
 * @param rows table rows
 * @param columnName column name
 * @returns first defined value, if any
 */
function getFirstDefinedValue(rows: Array<Record<string, unknown>>, columnName: string): unknown {
  for (const row of rows) {
    const value = row[columnName];
    if (value !== null && value !== undefined) {
      return value;
    }
  }

  return undefined;
}

/**
 * Infers a loaders.gl data type from a JavaScript value.
 * @param value sample value
 * @returns inferred data type
 */
function getDataTypeFromValue(value: unknown): DataType {
  if (typeof value === 'boolean') {
    return 'bool';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int32' : 'float64';
  }
  if (typeof value === 'string') {
    return 'utf8';
  }
  if (value instanceof Date) {
    return 'timestamp-millisecond';
  }
  if (value instanceof Uint8Array) {
    return 'binary';
  }

  throw new Error('ParquetJSWriter: Unable to infer a Parquet type from the provided row data');
}

/**
 * Formats a loaders.gl data type for error messages.
 * @param dataType input data type
 * @returns human-readable type string
 */
function formatDataType(dataType: DataType): string {
  return typeof dataType === 'string' ? dataType : dataType.type;
}
