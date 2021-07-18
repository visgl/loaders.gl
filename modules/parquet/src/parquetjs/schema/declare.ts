// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)

export type ParquetCodec = 'PLAIN' | 'RLE';
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

export type OriginalType =
  // Converted Types
  | 'UTF8' // 0
  // | 'MAP' // 1
  // | 'MAP_KEY_VALUE' // 2
  // | 'LIST' // 3
  // | 'ENUM' // 4
  // | 'DECIMAL' // 5
  | 'DATE' // 6
  | 'TIME_MILLIS' // 7
  | 'TIME_MICROS' // 8
  | 'TIMESTAMP_MILLIS' // 9
  | 'TIMESTAMP_MICROS' // 10
  | 'UINT_8' // 11
  | 'UINT_16' // 12
  | 'UINT_32' // 13
  | 'UINT_64' // 14
  | 'INT_8' // 15
  | 'INT_16' // 16
  | 'INT_32' // 17
  | 'INT_64' // 18
  | 'JSON' // 19
  | 'BSON' // 20
  | 'INTERVAL'; // 21

export interface SchemaDefinition {
  [string: string]: FieldDefinition;
}

export interface FieldDefinition {
  type?: ParquetType;
  typeLength?: number;
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
  repetitionType: RepetitionType;
  typeLength?: number;
  encoding?: ParquetCodec;
  compression?: ParquetCompression;
  rLevelMax: number;
  dLevelMax: number;
  isNested?: boolean;
  fieldCount?: number;
  fields?: Record<string, ParquetField>;
}

export interface ParquetData {
  dlevels: number[];
  rlevels: number[];
  values: any[];
  count: number;
}

export interface ParquetRecord {
  [key: string]: any;
}

export class ParquetBuffer {
  rowCount: number;
  columnData: Record<string, ParquetData>;
  constructor(rowCount: number = 0, columnData: Record<string, ParquetData> = {}) {
    this.rowCount = rowCount;
    this.columnData = columnData;
  }
}
