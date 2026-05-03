// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, Schema as TableSchema} from '@loaders.gl/schema';
import {convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {
  GeoArrowBuilder,
  type GeoArrowBuilderEncoding,
  type GeoParquetGeometryType,
  makeGeoArrowGeometryField,
  setGeoArrowGeometryColumnMetadata
} from '@loaders.gl/gis';
import {parseSHPHeader, type SHPHeader} from './parse-shp-header';
import type {SHPLoaderOptions} from './types';
import {writeRecordToGeoArrow} from './parse-shp-geometry';

const GEOMETRY_COLUMN_NAME = 'geometry';
const BIG_ENDIAN = false;
const SHP_HEADER_SIZE = 100;
const RECORD_HEADER_SIZE = 8;

/** Options for directly building a typed GeoArrow SHP geometry column. */
export type SHPGeoArrowGeometryOptions = {
  /** Coordinate transform applied while writing coordinates. */
  transform?: (coordinate: number[]) => number[];
};

/** Creates a typed GeoArrow geometry table by scanning SHP records in two passes. */
export function makeSHPGeoArrowGeometryTable(
  arrayBuffer: ArrayBuffer,
  options?: SHPLoaderOptions,
  geoArrowOptions?: SHPGeoArrowGeometryOptions
): ArrowTable {
  const header = parseSHPHeader(new DataView(arrayBuffer, 0, SHP_HEADER_SIZE));
  const encoding = getDefaultGeoArrowEncoding(header);
  const builderOptions = {
    encoding,
    hasZ: hasZCoordinates(header, options),
    transform: geoArrowOptions?.transform
  };

  const measureBuilder = new GeoArrowBuilder({mode: 'measure', ...builderOptions});
  scanSHPRecords(arrayBuffer, recordView => writeRecordToGeoArrow(measureBuilder, recordView));
  const measured = measureBuilder.getGeometryArray();

  const writeBuilder = new GeoArrowBuilder({mode: 'write', target: measured, ...builderOptions});
  scanSHPRecords(arrayBuffer, recordView => writeRecordToGeoArrow(writeBuilder, recordView));
  const geometryArray = writeBuilder.getGeometryArray();

  const schema = makeSHPGeoArrowGeometrySchema(header, encoding, geometryArray.coordinateSize);
  return makeGeoArrowGeometryTable(geometryArray, schema);
}

/** Creates a schema for a typed GeoArrow SHP geometry column. */
export function makeSHPGeoArrowGeometrySchema(
  header: SHPHeader | undefined,
  encoding: GeoArrowBuilderEncoding,
  coordinateSize: number
): TableSchema {
  const schema: TableSchema = {
    fields: [
      makeGeoArrowGeometryField({
        geometryColumnName: GEOMETRY_COLUMN_NAME,
        encoding,
        coordinateSize: coordinateSize === 3 ? 3 : 2
      })
    ],
    metadata: {}
  };

  setGeoArrowGeometryColumnMetadata(schema.metadata!, {
    geometryColumnName: GEOMETRY_COLUMN_NAME,
    encoding,
    geometryTypes: [getGeometryTypeFromGeoArrowEncoding(encoding, coordinateSize)]
  });

  return schema;
}

/** Wraps typed GeoArrow geometry buffers in a loaders.gl Arrow table. */
export function makeGeoArrowGeometryTable(
  geometryArray: ReturnType<GeoArrowBuilder['getGeometryArray']>,
  schema: TableSchema
): ArrowTable {
  const arrowSchema = convertSchemaToArrow(schema);
  const geometryData = GeoArrowBuilder.makeGeometryData(geometryArray);
  const structField = new arrow.Struct(arrowSchema.fields);
  const structData = new arrow.Data(structField, 0, geometryArray.length, 0, undefined, [
    geometryData
  ]);
  const recordBatch = new arrow.RecordBatch(arrowSchema, structData);

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, [recordBatch])
  };
}

/** Returns the default typed GeoArrow encoding for an SHP header. */
export function getDefaultGeoArrowEncoding(header?: SHPHeader): GeoArrowBuilderEncoding {
  switch (header?.type) {
    case 1:
    case 11:
    case 21:
      return 'geoarrow.point';
    case 3:
    case 13:
    case 23:
      return 'geoarrow.multilinestring';
    case 5:
    case 15:
    case 25:
      return 'geoarrow.multipolygon';
    case 8:
    case 18:
    case 28:
      return 'geoarrow.multipoint';
    default:
      return 'geoarrow.multipolygon';
  }
}

function scanSHPRecords(arrayBuffer: ArrayBuffer, visitRecord: (recordView: DataView) => void) {
  let offset = SHP_HEADER_SIZE;
  while (offset + RECORD_HEADER_SIZE <= arrayBuffer.byteLength) {
    const recordHeaderView = new DataView(arrayBuffer, offset, RECORD_HEADER_SIZE);
    const byteLength = recordHeaderView.getInt32(4, BIG_ENDIAN) * 2;
    offset += RECORD_HEADER_SIZE;
    if (byteLength <= 0 || offset + byteLength > arrayBuffer.byteLength) {
      break;
    }
    visitRecord(new DataView(arrayBuffer, offset, byteLength));
    offset += byteLength;
  }
}

function hasZCoordinates(header: SHPHeader, options?: SHPLoaderOptions): boolean {
  const maxDimensions = options?.shp?._maxDimensions ?? 4;
  return (
    (header.type === 11 || header.type === 13 || header.type === 15 || header.type === 18) &&
    Math.min(4, maxDimensions) > 2
  );
}

function getGeometryTypeFromGeoArrowEncoding(
  encoding: GeoArrowBuilderEncoding,
  coordinateSize: number
): GeoParquetGeometryType {
  const geometryType = getBaseGeometryTypeFromGeoArrowEncoding(encoding);
  return (coordinateSize === 3 ? `${geometryType} Z` : geometryType) as GeoParquetGeometryType;
}

function getBaseGeometryTypeFromGeoArrowEncoding(encoding: GeoArrowBuilderEncoding): string {
  switch (encoding) {
    case 'geoarrow.point':
      return 'Point';
    case 'geoarrow.linestring':
      return 'LineString';
    case 'geoarrow.polygon':
      return 'Polygon';
    case 'geoarrow.multipoint':
      return 'MultiPoint';
    case 'geoarrow.multilinestring':
      return 'MultiLineString';
    case 'geoarrow.multipolygon':
      return 'MultiPolygon';
    default:
      throw new Error(`Unsupported GeoArrow encoding ${encoding}`);
  }
}
