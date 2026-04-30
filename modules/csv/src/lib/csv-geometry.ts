// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataType, Field, Geometry, Schema} from '@loaders.gl/schema';
import {
  convertGeometryToWKB,
  convertWKBToGeometry,
  convertWKTToGeometry,
  decodeHex,
  getGeoMetadata,
  inferGeoParquetGeometryTypes,
  setGeoMetadata,
  type GeoParquetGeometryType
} from '@loaders.gl/gis';

const GEOMETRY_COLUMN_NAMES = new Set(['geom', 'geometry', 'the_geom', 'wkt', 'wkb']);
const MAX_GEOMETRY_SAMPLE_VALUES = 10;
export const MAX_GEOMETRY_SNIFF_ROWS = 50;

/** Geometry encodings supported by CSV geometry detection. */
export type CSVGeometryEncoding = 'geoarrow.wkb' | 'geoarrow.wkt';

/** Output encoding policy for detected CSV geometry columns. */
export type CSVGeometryOutputEncoding = 'wkb' | 'source';

/** One detected geometry column definition. */
export type DetectedGeometryColumn = {
  /** Geometry column name. */
  columnName: string;
  /** Geometry column index in array-row form. */
  columnIndex: number;
  /** GeoArrow extension name for the detected encoding. */
  encoding: CSVGeometryEncoding;
  /** Geometry type strings inferred from sampled values. */
  geometryTypes: GeoParquetGeometryType[];
};

/** Returns whether a column name is eligible for geometry sniffing. */
export function isGeometryColumnName(columnName: string): boolean {
  return GEOMETRY_COLUMN_NAMES.has(columnName.trim().toLowerCase());
}

/** Returns whether buffered rows are sufficient to finalize geometry sniffing. */
export function shouldFinalizeGeometryDetection(
  headerRow: string[],
  rows: unknown[][],
  maximumRowCount: number = MAX_GEOMETRY_SNIFF_ROWS
): boolean {
  const candidateColumnIndices = getGeometryCandidateColumnIndices(headerRow);
  if (candidateColumnIndices.length === 0) {
    return true;
  }

  if (rows.length >= maximumRowCount) {
    return true;
  }

  return candidateColumnIndices.every(columnIndex => {
    let sampledValueCount = 0;
    for (const row of rows) {
      const value = row[columnIndex];
      if (typeof value === 'string' && value.trim() !== '') {
        sampledValueCount++;
      }
      if (sampledValueCount >= MAX_GEOMETRY_SAMPLE_VALUES) {
        return true;
      }
    }
    return false;
  });
}

/** Detects geometry columns from buffered CSV array rows and header names. */
export function detectGeometryColumns(
  headerRow: string[],
  rows: unknown[][],
  geometryEncoding: CSVGeometryOutputEncoding = 'wkb'
): DetectedGeometryColumn[] {
  const detectedGeometryColumns: DetectedGeometryColumn[] = [];

  for (const columnIndex of getGeometryCandidateColumnIndices(headerRow)) {
    const sampledValues = sampleGeometryColumnValues(rows, columnIndex);
    if (sampledValues.length === 0) {
      continue;
    }

    const wktGeometries = collectWKTGeometries(sampledValues);
    if (wktGeometries) {
      detectedGeometryColumns.push({
        columnName: headerRow[columnIndex],
        columnIndex,
        encoding: geometryEncoding === 'source' ? 'geoarrow.wkt' : 'geoarrow.wkb',
        geometryTypes: inferGeoParquetGeometryTypes(wktGeometries)
      });
      continue;
    }

    const wkbGeometries = collectHexWKBGeometries(sampledValues);
    if (wkbGeometries) {
      detectedGeometryColumns.push({
        columnName: headerRow[columnIndex],
        columnIndex,
        encoding: 'geoarrow.wkb',
        geometryTypes: inferGeoParquetGeometryTypes(wkbGeometries)
      });
    }
  }

  return detectedGeometryColumns;
}

/** Normalizes one array row using the detected geometry column definitions. */
export function normalizeGeometryArrayRow(
  row: unknown[],
  detectedGeometryColumns: DetectedGeometryColumn[]
): unknown[] {
  if (detectedGeometryColumns.length === 0) {
    return row;
  }

  const normalizedRow = row.slice();
  for (const detectedGeometryColumn of detectedGeometryColumns) {
    normalizedRow[detectedGeometryColumn.columnIndex] = normalizeGeometryValue(
      normalizedRow[detectedGeometryColumn.columnIndex],
      detectedGeometryColumn.encoding
    );
  }
  return normalizedRow;
}

/** Normalizes one object row using the detected geometry column definitions. */
export function normalizeGeometryObjectRow(
  row: Record<string, unknown>,
  detectedGeometryColumns: DetectedGeometryColumn[]
): Record<string, unknown> {
  if (detectedGeometryColumns.length === 0) {
    return row;
  }

  const normalizedRow = {...row};
  for (const detectedGeometryColumn of detectedGeometryColumns) {
    normalizedRow[detectedGeometryColumn.columnName] = normalizeGeometryValue(
      normalizedRow[detectedGeometryColumn.columnName],
      detectedGeometryColumn.encoding
    );
  }
  return normalizedRow;
}

/** Builds a CSV schema from header order and row values, then adds GeoArrow metadata. */
export function deduceCSVSchemaFromRows(
  rows: Array<unknown[] | Record<string, unknown>>,
  headerRow: string[],
  detectedGeometryColumns: DetectedGeometryColumn[] = []
): Schema {
  const additionalColumnNames = getAdditionalObjectColumnNames(rows, headerRow);
  const orderedColumnNames = [...headerRow, ...additionalColumnNames];
  const detectedGeometryColumnMap = new Map(
    detectedGeometryColumns.map(detectedGeometryColumn => [
      detectedGeometryColumn.columnName,
      detectedGeometryColumn
    ])
  );

  const fields: Field[] = orderedColumnNames.map((columnName, columnIndex) => {
    const detectedGeometryColumn = detectedGeometryColumnMap.get(columnName);
    const fieldType = detectedGeometryColumn
      ? detectedGeometryColumn.encoding === 'geoarrow.wkb'
        ? 'binary'
        : 'utf8'
      : deduceCSVColumnType(rows, headerRow, columnName, columnIndex);

    const field: Field = {
      name: columnName,
      type: fieldType,
      nullable: true
    };

    if (detectedGeometryColumn) {
      field.metadata = {
        'ARROW:extension:name': detectedGeometryColumn.encoding
      };
    }

    return field;
  });

  const schema: Schema = {
    fields,
    metadata: {
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVLoader'
    }
  };

  annotateGeometrySchemaMetadata(schema, detectedGeometryColumns);
  return schema;
}

/** Converts an arbitrary CSV cell value to a geometry-aware normalized value. */
export function normalizeGeometryValue(
  value: unknown,
  encoding: CSVGeometryEncoding
): Uint8Array | string | null | unknown {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (encoding === 'geoarrow.wkb') {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmedValue = value.trim();
    if (isHexWKBString(trimmedValue)) {
      return decodeHex(trimmedValue);
    }
    const geometry = convertWKTToGeometry(trimmedValue);
    return geometry ? new Uint8Array(convertGeometryToWKB(geometry)) : null;
  }

  return typeof value === 'string' ? value : String(value);
}

/** Returns whether one value is a valid hex-encoded WKB string. */
export function isHexWKBString(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length < 10 || trimmedValue.length % 2 !== 0) {
    return false;
  }
  if (!trimmedValue.startsWith('00') && !trimmedValue.startsWith('01')) {
    return false;
  }
  return /^[0-9a-fA-F]+$/.test(trimmedValue.slice(2));
}

/** Collects geometry-like column indices from a header row. */
export function getGeometryCandidateColumnIndices(headerRow: string[]): number[] {
  const candidateColumnIndices: number[] = [];
  for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex++) {
    if (isGeometryColumnName(headerRow[columnIndex])) {
      candidateColumnIndices.push(columnIndex);
    }
  }
  return candidateColumnIndices;
}

/** Samples non-empty string values from one candidate geometry column. */
function sampleGeometryColumnValues(rows: unknown[][], columnIndex: number): string[] {
  const sampledValues: string[] = [];

  for (const row of rows) {
    const value = row[columnIndex];
    if (typeof value !== 'string') {
      continue;
    }
    if (value.trim() === '') {
      continue;
    }

    sampledValues.push(value);
    if (sampledValues.length >= MAX_GEOMETRY_SAMPLE_VALUES) {
      break;
    }
  }

  return sampledValues;
}

/** Returns sampled geometries when every sampled value is WKT, otherwise `null`. */
function collectWKTGeometries(sampledValues: string[]) {
  const geometries: Array<Geometry | null> = [];

  for (const sampledValue of sampledValues) {
    const trimmedValue = sampledValue.trim();
    try {
      const geometry = convertWKTToGeometry(trimmedValue);
      if (!geometry) {
        return null;
      }
      geometries.push(geometry);
    } catch {
      return null;
    }
  }

  return geometries;
}

/** Returns sampled geometries when every sampled value is hex WKB, otherwise `null`. */
function collectHexWKBGeometries(sampledValues: string[]) {
  const geometries: Geometry[] = [];

  for (const sampledValue of sampledValues) {
    const trimmedValue = sampledValue.trim();
    if (!isHexWKBString(trimmedValue)) {
      return null;
    }
    try {
      geometries.push(convertWKBToGeometry(decodeHex(trimmedValue).buffer));
    } catch {
      return null;
    }
  }

  return geometries;
}

/** Infers CSV schema metadata for detected geometry columns. */
function annotateGeometrySchemaMetadata(
  schema: Schema,
  detectedGeometryColumns: DetectedGeometryColumn[]
): void {
  if (detectedGeometryColumns.length === 0) {
    return;
  }

  const existingGeoMetadata = getGeoMetadata(schema.metadata || {}) || {
    version: '1.1.0',
    columns: {}
  };
  existingGeoMetadata.version ||= '1.1.0';
  existingGeoMetadata.columns ||= {};

  if (!existingGeoMetadata.primary_column) {
    existingGeoMetadata.primary_column = detectedGeometryColumns[0].columnName;
  }

  for (const detectedGeometryColumn of detectedGeometryColumns) {
    existingGeoMetadata.columns[detectedGeometryColumn.columnName] = {
      ...existingGeoMetadata.columns[detectedGeometryColumn.columnName],
      encoding: detectedGeometryColumn.encoding === 'geoarrow.wkb' ? 'wkb' : 'wkt',
      geometry_types: detectedGeometryColumn.geometryTypes
    };
  }

  setGeoMetadata(schema.metadata!, existingGeoMetadata);
}

/** Returns column names that are present only on object-row data. */
function getAdditionalObjectColumnNames(
  rows: Array<unknown[] | Record<string, unknown>>,
  headerRow: string[]
): string[] {
  const seenColumns = new Set(headerRow);
  const additionalColumnNames: string[] = [];

  for (const row of rows) {
    if (Array.isArray(row) || !row) {
      continue;
    }
    for (const columnName of Object.keys(row)) {
      if (seenColumns.has(columnName)) {
        continue;
      }
      seenColumns.add(columnName);
      additionalColumnNames.push(columnName);
    }
  }

  return additionalColumnNames;
}

/** Infers the field type for one CSV column using the first non-null value in row order. */
function deduceCSVColumnType(
  rows: Array<unknown[] | Record<string, unknown>>,
  headerRow: string[],
  columnName: string,
  columnIndex: number
): DataType {
  for (const row of rows) {
    const value = Array.isArray(row)
      ? row[columnIndex]
      : row && typeof row === 'object'
        ? (row as Record<string, unknown>)[columnName]
        : null;
    const fieldType = deduceCSVValueType(value);
    if (fieldType !== 'null') {
      return fieldType;
    }
  }

  return headerRow[columnIndex] === columnName ? 'utf8' : 'null';
}

/** Infers the schema data type for one CSV value. */
function deduceCSVValueType(value: unknown): DataType {
  if (value instanceof Date) {
    return 'date-millisecond';
  }
  if (typeof value === 'number') {
    return 'float64';
  }
  if (typeof value === 'boolean') {
    return 'bool';
  }
  if (typeof value === 'string') {
    return 'utf8';
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return 'binary';
  }
  return 'null';
}
