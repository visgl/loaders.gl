// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import Int64 from 'node-int64';
import type {PageHeader} from '../parquet-thrift';
import type {ParquetValueBuffer} from '../codecs/declare';

export type ParquetCodec =
  | 'PLAIN'
  | 'RLE'
  | 'PLAIN_DICTIONARY'
  | 'RLE_DICTIONARY'
  | 'DELTA_BINARY_PACKED'
  | 'DELTA_LENGTH_BYTE_ARRAY'
  | 'DELTA_BYTE_ARRAY'
  | 'BYTE_STREAM_SPLIT';
export type ParquetCompression =
  | 'UNCOMPRESSED'
  | 'GZIP'
  | 'SNAPPY'
  | 'LZO'
  | 'BROTLI'
  | 'LZ4'
  | 'LZ4_RAW'
  | 'ZSTD';
export type RepetitionType = 'REQUIRED' | 'OPTIONAL' | 'REPEATED';
export type ParquetType = PrimitiveType | OriginalType;

/**
 * Physical type
 */
export type PrimitiveType =
  // Base Types
  | 'BOOLEAN' // 0
  | 'INT32' // 1
  | 'INT64' // 2
  | 'INT96' // 3
  | 'FLOAT' // 4
  | 'DOUBLE' // 5
  | 'BYTE_ARRAY' // 6,
  | 'FIXED_LEN_BYTE_ARRAY'; // 7

/**
 * Logical type
 */
export type OriginalType =
  // Converted Types
  | 'UTF8' // 0
  // | 'MAP' // 1
  // | 'MAP_KEY_VALUE' // 2
  // | 'LIST' // 3
  // | 'ENUM' // 4
  // | 'DECIMAL' // 5
  | 'DECIMAL_INT32' // 5
  | 'DECIMAL_INT64' // 5
  | 'DECIMAL_BYTE_ARRAY' // 5
  | 'DECIMAL_FIXED_LEN_BYTE_ARRAY' // 5
  | 'DATE' // 6
  | 'TIME_MILLIS' // 7
  | 'TIME_MICROS' // 8
  | 'TIME_NANOS'
  | 'TIMESTAMP_MILLIS' // 9
  | 'TIMESTAMP_MICROS' // 10
  | 'TIMESTAMP_NANOS'
  | 'UINT_8' // 11
  | 'UINT_16' // 12
  | 'UINT_32' // 13
  | 'UINT_64' // 14
  | 'INT_8' // 15
  | 'INT_16' // 16
  | 'INT_32' // 17
  | 'INT_64' // 18
  | 'ENUM'
  | 'UUID'
  | 'FLOAT16'
  | 'UNKNOWN'
  | 'VARIANT'
  | 'GEOMETRY'
  | 'GEOGRAPHY'
  | 'JSON' // 19
  | 'BSON' // 20
  | 'INTERVAL'; // 21

/** Units carried by Parquet TIME and TIMESTAMP logical type annotations. */
export type ParquetTimeUnit = 'MILLIS' | 'MICROS' | 'NANOS';

/** Logical type names defined by the Parquet 2.13 format. */
export type ParquetLogicalTypeName =
  | 'STRING'
  | 'MAP'
  | 'LIST'
  | 'ENUM'
  | 'DECIMAL'
  | 'DATE'
  | 'TIME'
  | 'TIMESTAMP'
  | 'INTEGER'
  | 'UNKNOWN'
  | 'JSON'
  | 'BSON'
  | 'UUID'
  | 'FLOAT16'
  | 'VARIANT'
  | 'GEOMETRY'
  | 'GEOGRAPHY';

/** Serializable representation of one Parquet logical type annotation. */
export interface ParquetLogicalType {
  /** Logical type discriminator. */
  type: ParquetLogicalTypeName;
  /** Integer width for INTEGER annotations. */
  bitWidth?: 8 | 16 | 32 | 64;
  /** Whether an INTEGER annotation is signed. */
  isSigned?: boolean;
  /** Time unit for TIME and TIMESTAMP annotations. */
  unit?: ParquetTimeUnit;
  /** Whether a TIME or TIMESTAMP value represents a UTC-normalized instant. */
  isAdjustedToUTC?: boolean;
  /** Decimal precision. */
  precision?: number;
  /** Decimal scale. */
  scale?: number;
  /** Variant specification version. */
  specificationVersion?: number;
  /** Coordinate reference system for geospatial logical types. */
  crs?: string;
  /** Edge interpolation algorithm for GEOGRAPHY values. */
  algorithm?: string;
}

export type ParquetDictionary = any[];

export interface SchemaDefinition {
  [string: string]: FieldDefinition;
}

export interface FieldDefinition {
  type?: ParquetType;
  /** Physical type declared by the file, retained independently from its logical type. */
  physicalType?: PrimitiveType;
  typeLength?: number;
  /** @deprecated Use `precision`. */
  presision?: number;
  /** Decimal precision. */
  precision?: number;
  scale?: number;
  /** Modern Parquet logical type annotation. */
  logicalType?: ParquetLogicalType;
  /** Stable field identifier declared by the Parquet schema. */
  fieldId?: number;
  encoding?: ParquetCodec;
  compression?: ParquetCompression;
  optional?: boolean;
  repeated?: boolean;
  fields?: SchemaDefinition;
}

export interface ParquetField {
  name: string;
  path: string[];
  key: string;
  primitiveType?: PrimitiveType;
  originalType?: OriginalType;
  /** Modern Parquet logical type annotation. */
  logicalType?: ParquetLogicalType;
  /** Stable field identifier declared by the Parquet schema. */
  fieldId?: number;
  repetitionType: RepetitionType;
  typeLength?: number;
  /** @deprecated Use `precision`. */
  presision?: number;
  /** Decimal precision. */
  precision?: number;
  scale?: number;
  encoding?: ParquetCodec;
  compression?: ParquetCompression;
  rLevelMax: number;
  dLevelMax: number;
  isNested?: boolean;
  fieldCount?: number;
  fields?: Record<string, ParquetField>;
}

/** @todo better name, this is an internal type? */
export interface ParquetReaderContext {
  type: ParquetType;
  rLevelMax: number;
  dLevelMax: number;
  compression: ParquetCompression;
  column: ParquetField;
  numValues?: Int64;
  dictionary?: ParquetDictionary;
  /** If true, binary values are not converted to strings */
  preserveBinary?: boolean;
  /** Retain byte arrays as views into decoded page buffers for direct materialization. */
  retainByteArrayViews?: boolean;
  /** Decode primitive values into typed column buffers when their physical type permits it. */
  useTypedValueBuffers?: boolean;
}

export interface ParquetPageData {
  dlevels: number[];
  rlevels: number[];
  /** Actual column chunks */
  values: ParquetValueBuffer;
  /** Number of values written directly into the column destination, if one was supplied. */
  directValuesWritten?: number;
  count: number;
  dictionary?: ParquetDictionary;
  /** The "raw" page header from the file */
  pageHeader: PageHeader;
}

export interface ParquetRow {
  [key: string]: any;
}

/** @
 * Holds data for one row group (column chunks) */
export class ParquetRowGroup {
  /** Number of rows in this page */
  rowCount: number;
  /** Map of Column chunks */
  columnData: Record<string, ParquetColumnChunk>;

  constructor(rowCount: number = 0, columnData: Record<string, ParquetColumnChunk> = {}) {
    this.rowCount = rowCount;
    this.columnData = columnData;
  }
}

/** Holds the data for one column chunk */
export interface ParquetColumnChunk {
  dlevels: number[];
  rlevels: number[];
  values: ParquetValueBuffer;
  count: number;
  pageHeaders: PageHeader[];
}
