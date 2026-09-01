// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  convertFeatureCollectionToGeoArrowTable as convertGISFeatureCollectionToGeoArrowTable,
  convertFeaturesToGeoArrowTable as convertGISFeaturesToGeoArrowTable
} from '@loaders.gl/gis';
import type {
  ArrowTable,
  Feature,
  Geometry,
  GeoArrowEncodingPreference,
  GeoJSONTable,
  Table
} from '@loaders.gl/schema';
import {convertTableToArrow} from '@loaders.gl/schema-utils';
import type * as arrow from 'apache-arrow';
import {convertGeoArrowGeometry} from './geoarrow-converter/convert-geoarrow-geometry';
import type {GeoArrowGeometryConvertOptions} from './geoarrow-converter/convert-geoarrow-geometry';
import type {GeoArrowEncoding} from './metadata/geoarrow-metadata';

/** Encodings accepted when converting feature geometry columns to GeoArrow output. */
export type GeoArrowConvertFromEncoding = 'wkb' | 'wkt' | 'geometry' | 'native' | GeoArrowEncoding;

/** Options for converting loaders.gl tables to GeoArrow-compatible Arrow tables. */
export type GeoArrowConvertFromOptions = {
  /** Optional batch size forwarded to generic table-to-Arrow conversion. */
  batchSize?: number;
  /** GeoArrow-specific conversion options. */
  geoarrow?: GeoArrowGeometryConvertOptions & {
    /** Geometry encoding to write for GeoJSON feature inputs. */
    encoding?: GeoArrowConvertFromEncoding;
    /** Preferred loader-facing output policy; mutually exclusive with `encoding`. */
    encodingPreference?: GeoArrowEncodingPreference;
    /** Geometry field name to preserve when adapting generic row or column tables. */
    geometryColumnName?: string;
  };
};

/**
 * Converts a loaders.gl table to an Apache Arrow table with GeoArrow-compatible geometry metadata when possible.
 *
 * Today this performs a geometry-aware conversion for `geojson-table` inputs and otherwise falls back to
 * generic Arrow conversion, preserving any existing schema metadata on the source table.
 */
export function convertTableToGeoArrow(
  table: Table,
  options?: GeoArrowConvertFromOptions
): arrow.Table {
  const encoding = resolveGeoArrowEncoding(options);

  switch (table.shape) {
    case 'arrow-table':
      return convertArrowTableToGeoArrow(table.data, encoding, options);

    case 'geojson-table':
      return convertFeatureCollectionToGeoArrowTable(table, options).data;

    default:
      if (encoding) {
        const featureTable = convertGenericGeometryTable(table, options);
        if (featureTable) {
          return featureTable.data;
        }
      }
      return convertArrowTableToGeoArrow(convertTableToArrow(table, options), encoding, options);
  }
}

/**
 * Converts a GeoJSON feature collection table to a loaders.gl Arrow table with WKB geometry metadata.
 */
export function convertFeatureCollectionToGeoArrowTable(
  table: GeoJSONTable,
  options?: GeoArrowConvertFromOptions
): ArrowTable {
  const encoding = resolveGeoArrowEncoding(options);
  const arrowTable = convertGISFeatureCollectionToGeoArrowTable(table, {
    encoding: getGeoJSONStagingEncoding(encoding),
    geometryColumnName: options?.geoarrow?.geometryColumnName
  });
  return {
    shape: 'arrow-table',
    data: convertGeoJSONArrowTableToTarget(arrowTable.data, encoding, options)
  };
}

/**
 * Converts GeoJSON features into a loaders.gl Arrow table with WKB geometry metadata.
 */
export function convertFeaturesToGeoArrowTable(
  features: Feature[],
  options?: GeoArrowConvertFromOptions
): ArrowTable {
  const encoding = resolveGeoArrowEncoding(options);
  const arrowTable = convertGISFeaturesToGeoArrowTable(features, {
    encoding: getGeoJSONStagingEncoding(encoding),
    geometryColumnName: options?.geoarrow?.geometryColumnName
  });
  return {
    shape: 'arrow-table',
    data: convertGeoJSONArrowTableToTarget(arrowTable.data, encoding, options)
  };
}

/** Converts generic row and column tables when they contain GeoJSON geometry values. */
function convertGenericGeometryTable(
  table: Exclude<Table, ArrowTable | GeoJSONTable>,
  options?: GeoArrowConvertFromOptions
): ArrowTable | null {
  const geometryColumn = options?.geoarrow?.geometryColumn || 'geometry';
  const rows = getGenericTableRows(table);
  if (!rows.some(row => isGeoJSONGeometry(row[geometryColumn]))) {
    return null;
  }

  const features: Feature[] = rows.map(row => {
    const geometry = row[geometryColumn];
    const properties = {...row};
    delete properties[geometryColumn];
    return {
      type: 'Feature',
      properties,
      // The GIS encoder accepts null geometry rows even though the GeoJSON Feature type is non-null.
      geometry: (isGeoJSONGeometry(geometry) ? geometry : null) as unknown as Geometry
    };
  });
  return convertFeaturesToGeoArrowTable(features, {
    ...options,
    geoarrow: {
      ...options?.geoarrow,
      geometryColumnName: options?.geoarrow?.geometryColumnName || geometryColumn
    }
  });
}

/** Materializes generic table rows for the opt-in geometry adaptation path. */
function getGenericTableRows(
  table: Exclude<Table, ArrowTable | GeoJSONTable>
): Record<string, unknown>[] {
  switch (table.shape) {
    case 'object-row-table':
      return table.data as Record<string, unknown>[];
    case 'array-row-table': {
      const fieldNames = table.schema?.fields.map(field => field.name) || [];
      return table.data.map(row =>
        Object.fromEntries(fieldNames.map((fieldName, fieldIndex) => [fieldName, row[fieldIndex]]))
      );
    }
    case 'columnar-table': {
      const columnNames = Object.keys(table.data);
      const rowCount = columnNames.length > 0 ? table.data[columnNames[0]].length : 0;
      return Array.from({length: rowCount}, (_value, rowIndex) =>
        Object.fromEntries(
          columnNames.map(columnName => [columnName, table.data[columnName][rowIndex]])
        )
      );
    }
    default:
      return [];
  }
}

/** Returns true for a GeoJSON geometry object, excluding Feature wrappers. */
function isGeoJSONGeometry(value: unknown): value is Geometry {
  if (!value || typeof value !== 'object') return false;
  const geometryType = (value as {type?: unknown}).type;
  return (
    geometryType === 'Point' ||
    geometryType === 'MultiPoint' ||
    geometryType === 'LineString' ||
    geometryType === 'MultiLineString' ||
    geometryType === 'Polygon' ||
    geometryType === 'MultiPolygon' ||
    geometryType === 'GeometryCollection'
  );
}

/** Preserves the GIS WKB/WKT staging table when it already matches the requested output. */
function convertGeoJSONArrowTableToTarget(
  table: arrow.Table,
  encoding: GeoArrowGeometryTarget | undefined,
  options?: GeoArrowConvertFromOptions
): arrow.Table {
  if (!encoding || encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt') {
    return table;
  }
  return convertArrowTableToGeoArrow(table, encoding, options);
}

/** Converts a generic Arrow table into the requested GeoArrow encoding. */
function convertArrowTableToGeoArrow(
  table: arrow.Table,
  encoding: GeoArrowGeometryTarget | undefined,
  options?: GeoArrowConvertFromOptions
): arrow.Table {
  if (!encoding) {
    return table;
  }
  return convertGeoArrowGeometry(table, encoding, options?.geoarrow);
}

/** Uses WKB as the compact staging encoding for GeoJSON geometry values. */
function getGeoJSONStagingEncoding(encoding: GeoArrowGeometryTarget | undefined): 'wkb' | 'wkt' {
  return encoding === 'geoarrow.wkt' ? 'wkt' : 'wkb';
}

/** Normalizes public GeoArrow encoding names to canonical GeoArrow encodings. */
function normalizeGeoArrowEncoding(
  encoding: GeoArrowConvertFromEncoding | undefined
): GeoArrowGeometryTarget | undefined {
  switch (encoding) {
    case undefined:
      return undefined;
    case 'wkb':
    case 'geoarrow.wkb':
      return 'geoarrow.wkb';
    case 'wkt':
    case 'geoarrow.wkt':
      return 'geoarrow.wkt';
    case 'native':
      return 'native';
    case 'geometry':
      return 'geoarrow.geometry';
    case 'geoarrow.point':
    case 'geoarrow.linestring':
    case 'geoarrow.polygon':
    case 'geoarrow.multipoint':
    case 'geoarrow.multilinestring':
    case 'geoarrow.multipolygon':
    case 'geoarrow.geometry':
    case 'geoarrow.geometrycollection':
    case 'geoarrow.box':
      return encoding;
    default:
      throw new Error(`Unknown GeoArrow encoding "${encoding}"`);
  }
}

/** Resolves an exact converter target or a loader-facing encoding preference. */
function resolveGeoArrowEncoding(
  options?: GeoArrowConvertFromOptions
): GeoArrowGeometryTarget | undefined {
  const exactEncoding = options?.geoarrow?.encoding;
  const encodingPreference = options?.geoarrow?.encodingPreference;
  if (exactEncoding !== undefined && encodingPreference !== undefined) {
    throw new Error('GeoArrow conversion cannot specify both encoding and encodingPreference.');
  }
  if (encodingPreference === 'geoarrow.wkb') return 'geoarrow.wkb';
  if (encodingPreference === 'geoarrow.geometry') return 'geoarrow.geometry';
  if (encodingPreference === 'optimized') return 'native';
  return normalizeGeoArrowEncoding(exactEncoding);
}

type GeoArrowGeometryTarget = GeoArrowEncoding | 'native';
