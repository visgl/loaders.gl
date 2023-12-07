// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Field, DataType} from '@loaders.gl/schema';
import * as fgb from 'flatgeobuf';

/**
 * @param fgbHeader
 * geometryType: GeometryType;
 * columns: ColumnMeta[] | null;
 * envelope: Float64Array | null;
 * featuresCount: number;
 * indexNodeSize: number;
 * crs: CrsMeta | null;
 * title: string | null;
 * description: string | null;
 * metadata: string | null;
 */
export function getSchemaFromFGBHeader(fgbHeader: fgb.HeaderMeta): Schema {
  const metadata: Record<string, string> = {
    title: fgbHeader.title || '',
    description: fgbHeader.description || '',
    crs: JSON.stringify(fgbHeader.crs) || '',
    metadata: fgbHeader.metadata || '',
    geometryType: String(fgbHeader.geometryType),
    indexNodeSize: String(fgbHeader.indexNodeSize),
    featureCount: String(fgbHeader.featuresCount),
    bounds: fgbHeader.envelope?.join(',') || ''
  };

  const fields: Field[] = fgbHeader.columns?.map((column) => getFieldFromFGBColumn(column)) || [];
  return {metadata, fields};
}

/**
 * name: string;
 * type: ColumnType;
 * title: string | null;
 * description: string | null;
 * width: number;
 * precision: number;
 * scale: number;
 * nullable: boolean;
 * unique: boolean;
 * primary_key: boolean;
 */
function getFieldFromFGBColumn(fgbColumn: fgb.ColumnMeta): Field {
  const metadata: Record<string, string> = {
    title: fgbColumn.title || '',
    description: fgbColumn.description || '',
    width: String(fgbColumn.width),
    precision: String(fgbColumn.precision),
    scale: String(fgbColumn.scale),
    unique: String(fgbColumn.unique),
    primary_key: String(fgbColumn.primary_key)
  };

  return {
    name: fgbColumn.name,
    type: getTypeFromFGBType(fgbColumn.type as unknown as fgbColumnType),
    nullable: fgbColumn.nullable,
    metadata
  };
}

/** Note: fgb.ColumType does not appear to be exported */
enum fgbColumnType {
  Byte = 0,
  UByte = 1,
  Bool = 2,
  Short = 3,
  UShort = 4,
  Int = 5,
  UInt = 6,
  Long = 7,
  ULong = 8,
  Float = 9,
  Double = 10,
  String = 11,
  Json = 12,
  DateTime = 13,
  Binary = 14
}

/** Convert FGB types to arrow like types */
function getTypeFromFGBType(fgbType: fgbColumnType /* fgb.ColumnMeta['type'] */): DataType {
  switch (fgbType) {
    case fgbColumnType.Byte:
      return 'int8';
    case fgbColumnType.UByte:
      return 'uint8';
    case fgbColumnType.Bool:
      return 'bool';
    case fgbColumnType.Short:
      return 'int16';
    case fgbColumnType.UShort:
      return 'uint16';
    case fgbColumnType.Int:
      return 'int32';
    case fgbColumnType.UInt:
      return 'uint32';
    case fgbColumnType.Long:
      return 'int64';
    case fgbColumnType.ULong:
      return 'uint64';
    case fgbColumnType.Float:
      return 'float32';
    case fgbColumnType.Double:
      return 'float64';
    case fgbColumnType.String:
      return 'utf8';
    case fgbColumnType.Json:
      return 'null';
    case fgbColumnType.DateTime:
      return 'date-millisecond';
    case fgbColumnType.Binary:
      return 'binary';
    default:
      return 'null';
  }
}
