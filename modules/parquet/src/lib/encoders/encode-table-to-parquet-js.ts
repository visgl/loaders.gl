// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataType, Field, ObjectRowTable, Schema, Table} from '@loaders.gl/schema';
import {
  getGeoMetadata,
  type GeoArrowEdgeType,
  type GeoArrowMetadata,
  type GeoColumnMetadata
} from '@loaders.gl/gis';
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
    convertSchemaToParquetSchema(table.schema!, objectRowTable, options)
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
  objectRowTable: ObjectRowTable,
  options: ParquetJSWriterOptions
): SchemaDefinition {
  const parquetFields: SchemaDefinition = {};
  const columnEncodings = options.parquet?.columnEncodings || {};
  const columnDictionaries = options.parquet?.columnDictionaries || {};
  const fieldNames = new Set(schema.fields.map(field => field.name));
  const geoMetadata = getGeoMetadata(schema.metadata);
  for (const columnName of Object.keys(columnEncodings)) {
    if (!fieldNames.has(columnName)) {
      throw new Error(`ParquetJSWriter: Unknown column encoding override "${columnName}"`);
    }
  }
  for (const columnName of Object.keys(columnDictionaries)) {
    if (!fieldNames.has(columnName)) {
      throw new Error(`ParquetJSWriter: Unknown column dictionary override "${columnName}"`);
    }
  }

  for (const field of schema.fields) {
    parquetFields[field.name] = {
      ...convertFieldToParquetFieldDefinition(
        field,
        objectRowTable.data,
        geoMetadata?.version,
        geoMetadata?.columns?.[field.name]
      ),
      encoding: columnEncodings[field.name]
    };
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
  rows: Array<Record<string, unknown>>,
  geoParquetVersion?: string,
  geoColumnMetadata?: GeoColumnMetadata
): FieldDefinition {
  const sampleValue = getFirstDefinedValue(rows, field.name);
  const nullable = field.nullable ?? sampleValue === undefined;
  const dataType = field.type === 'null' ? getDataTypeFromValue(sampleValue) : field.type;

  switch (dataType) {
    case 'bool':
      return {type: 'BOOLEAN', optional: nullable};

    case 'int':
    case 'int32':
      return {type: 'INT_32', optional: nullable};

    case 'int8':
      return {type: 'INT_8', optional: nullable};

    case 'int16':
      return {type: 'INT_16', optional: nullable};

    case 'uint8':
      return {type: 'UINT_8', optional: nullable};

    case 'uint16':
      return {type: 'UINT_16', optional: nullable};

    case 'uint32':
      return {type: 'UINT_32', optional: nullable};

    case 'int64':
      return {type: 'INT_64', optional: nullable};

    case 'uint64':
      return {type: 'UINT_64', optional: nullable};

    case 'float':
    case 'float32':
      return {type: 'FLOAT', optional: nullable};

    case 'float16':
      return {type: 'FLOAT16', optional: nullable};

    case 'float64':
      return {type: 'DOUBLE', optional: nullable};

    case 'utf8':
      return {type: 'UTF8', optional: nullable};

    case 'binary':
      if (
        geoParquetVersion?.startsWith('2.') &&
        String(geoColumnMetadata?.encoding).toLowerCase() === 'wkb'
      ) {
        return getNativeGeospatialFieldDefinition(
          nullable,
          getNativeGeospatialCRS(geoColumnMetadata?.crs),
          geoColumnMetadata?.edges
        );
      }
      if (!geoParquetVersion) {
        const geoArrowMetadata = getWKBGeoArrowMetadata(field);
        if (geoArrowMetadata) {
          return getNativeGeospatialFieldDefinition(
            nullable,
            getGeoArrowNativeCRS(geoArrowMetadata),
            geoArrowMetadata.edges
          );
        }
      }
      return {type: 'BYTE_ARRAY', optional: nullable};

    case 'date-day':
      return {type: 'DATE', optional: nullable};

    case 'date-millisecond':
    case 'timestamp-second':
    case 'timestamp-millisecond':
      return {type: 'TIMESTAMP_MILLIS', optional: nullable};

    case 'timestamp-microsecond':
      return {type: 'TIMESTAMP_MICROS', optional: nullable};

    case 'timestamp-nanosecond':
      return {type: 'TIMESTAMP_NANOS', optional: nullable};

    case 'time-second':
    case 'time-millisecond':
      return {type: 'TIME_MILLIS', optional: nullable};

    case 'time-microsecond':
      return {type: 'TIME_MICROS', optional: nullable};

    case 'time-nanosecond':
      return {type: 'TIME_NANOS', optional: nullable};

    default:
      if (typeof dataType === 'object' && dataType.type === 'decimal') {
        const physicalType =
          dataType.precision <= 9
            ? 'DECIMAL_INT32'
            : dataType.precision <= 18
              ? 'DECIMAL_INT64'
              : 'DECIMAL_FIXED_LEN_BYTE_ARRAY';
        return {
          type: physicalType,
          typeLength:
            physicalType === 'DECIMAL_FIXED_LEN_BYTE_ARRAY'
              ? getDecimalByteWidth(dataType.precision)
              : undefined,
          precision: dataType.precision,
          scale: dataType.scale,
          optional: nullable
        };
      }
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

/** Serializes GeoParquet CRS metadata into the native Parquet logical-type string. */
function getNativeGeospatialCRS(crs: object | null | undefined): string | undefined {
  if (crs === null) return 'srid:0';
  return crs === undefined ? undefined : JSON.stringify(crs);
}

/** Creates a native GEOMETRY or GEOGRAPHY field from normalized spatial semantics. */
function getNativeGeospatialFieldDefinition(
  nullable: boolean,
  crs: string | undefined,
  edges: 'planar' | GeoArrowEdgeType | undefined
): FieldDefinition {
  return edges && edges !== 'planar'
    ? {
        type: 'GEOGRAPHY',
        optional: nullable,
        logicalType: {type: 'GEOGRAPHY', crs, algorithm: edges.toUpperCase()}
      }
    : {
        type: 'GEOMETRY',
        optional: nullable,
        logicalType: {type: 'GEOMETRY', crs}
      };
}

/** Reads validated GeoArrow WKB extension metadata from a field. */
function getWKBGeoArrowMetadata(field: Field): GeoArrowMetadata | undefined {
  if (field.metadata?.['ARROW:extension:name']?.toLowerCase() !== 'geoarrow.wkb') return undefined;
  const serializedMetadata = field.metadata['ARROW:extension:metadata'];
  if (!serializedMetadata) return {};
  let metadata: unknown;
  try {
    metadata = JSON.parse(serializedMetadata);
  } catch (error) {
    throw new Error(`ParquetJSWriter: Invalid GeoArrow metadata on "${field.name}"`, {
      cause: error
    });
  }
  if (!metadata || typeof metadata !== 'object') {
    throw new Error(`ParquetJSWriter: Invalid GeoArrow metadata on "${field.name}"`);
  }
  const candidate = metadata as GeoArrowMetadata;
  if (
    candidate.crs !== undefined &&
    typeof candidate.crs !== 'string' &&
    (typeof candidate.crs !== 'object' || candidate.crs === null)
  ) {
    throw new Error(`ParquetJSWriter: Invalid GeoArrow CRS on "${field.name}"`);
  }
  if (
    candidate.edges !== undefined &&
    !['spherical', 'vincenty', 'thomas', 'andoyer', 'karney'].includes(candidate.edges)
  ) {
    throw new Error(`ParquetJSWriter: Invalid GeoArrow edges on "${field.name}"`);
  }
  return candidate;
}

/** Maps GeoArrow CRS semantics onto the native Parquet logical-type property. */
function getGeoArrowNativeCRS(metadata: GeoArrowMetadata): string {
  if (metadata.crs === undefined) return 'srid:0';
  return typeof metadata.crs === 'string' ? metadata.crs : JSON.stringify(metadata.crs);
}

/** Returns the minimum fixed byte width required by one decimal precision. */
function getDecimalByteWidth(precision: number): number {
  for (let byteWidth = 1; byteWidth <= 32; byteWidth++) {
    const maximumPrecision = Math.floor(Math.log10(2 ** (8 * byteWidth - 1) - 1));
    if (precision <= maximumPrecision) return byteWidth;
  }
  throw new Error(`ParquetJSWriter: Decimal precision ${precision} exceeds 32 bytes`);
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
