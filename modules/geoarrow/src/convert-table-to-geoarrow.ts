// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {convertGeometryToWKB, convertGeometryToWKT} from '@loaders.gl/gis';
import type {
  ArrowTable,
  Feature,
  Field,
  Geometry,
  GeoJsonProperties,
  GeoJSONTable,
  Schema,
  Table
} from '@loaders.gl/schema';
import {
  ArrowTableBuilder,
  convertTableToArrow,
  getDataTypeFromArray
} from '@loaders.gl/schema-utils';
import type * as arrow from 'apache-arrow';
import type {GeoArrowEncoding} from './metadata/geoarrow-metadata';

const GEOMETRY_COLUMN_NAME = 'geometry';
const GEO_METADATA_VERSION = '1.1.0';

export type GeoArrowConvertFromEncoding = 'wkb' | 'wkt' | 'geometry' | GeoArrowEncoding;

export type GeoArrowConvertFromOptions = {
  batchSize?: number;
  geoarrow?: {
    encoding?: GeoArrowConvertFromEncoding;
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
  const encoding = normalizeGeoArrowEncoding(options?.geoarrow?.encoding);

  switch (table.shape) {
    case 'arrow-table':
      return table.data;

    case 'geojson-table':
      return convertFeatureCollectionToGeoArrowTable(table, {geoarrow: {encoding}}).data;

    default:
      return convertTableToArrow(table, options);
  }
}

/**
 * Converts a GeoJSON feature collection table to a loaders.gl Arrow table with WKB geometry metadata.
 */
export function convertFeatureCollectionToGeoArrowTable(
  table: GeoJSONTable,
  options?: GeoArrowConvertFromOptions
): ArrowTable {
  return convertFeaturesToGeoArrowTable(table.features, options);
}

/**
 * Converts GeoJSON features into a loaders.gl Arrow table with WKB geometry metadata.
 */
export function convertFeaturesToGeoArrowTable(
  features: Feature[],
  options?: GeoArrowConvertFromOptions
): ArrowTable {
  const encoding = normalizeGeoArrowEncoding(options?.geoarrow?.encoding);
  const propertyRows = features.map(feature => normalizeProperties(feature.properties));
  const propertySchema = getPropertySchema(propertyRows);
  const schema = buildFeatureArrowSchema(propertySchema, features, encoding);
  const arrowTableBuilder = new ArrowTableBuilder(schema);

  for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
    arrowTableBuilder.addObjectRow(
      makeFeatureArrowRow(propertyRows[featureIndex], features[featureIndex], encoding)
    );
  }

  return arrowTableBuilder.finishTable();
}

function buildFeatureArrowSchema(
  propertySchema: Schema,
  features: Feature[],
  encoding: 'wkb' | 'wkt'
): Schema {
  const geometryField: Field = {
    name: GEOMETRY_COLUMN_NAME,
    type: encoding === 'wkt' ? 'utf8' : 'binary',
    nullable: true,
    metadata: {}
  };

  return {
    fields: [...propertySchema.fields, geometryField],
    metadata: {
      ...(propertySchema.metadata || {}),
      geo: JSON.stringify({
        version: GEO_METADATA_VERSION,
        primary_column: GEOMETRY_COLUMN_NAME,
        columns: {
          [GEOMETRY_COLUMN_NAME]: {
            encoding,
            geometry_types: inferFeatureGeometryTypes(features)
          }
        }
      })
    }
  };
}

function makeFeatureArrowRow(
  properties: Record<string, unknown>,
  feature: Feature,
  encoding: 'wkb' | 'wkt'
): Record<string, unknown> {
  return {
    ...properties,
    [GEOMETRY_COLUMN_NAME]: feature.geometry
      ? encoding === 'wkt'
        ? convertGeometryToWKT(feature.geometry)
        : new Uint8Array(
            convertGeometryToWKB(feature.geometry, getGeometryWKBOptions(feature.geometry))
          )
      : null
  };
}

function normalizeGeoArrowEncoding(
  encoding: GeoArrowConvertFromEncoding | undefined
): 'wkb' | 'wkt' {
  switch (encoding) {
    case undefined:
    case 'wkb':
    case 'geoarrow.wkb':
      return 'wkb';
    case 'wkt':
    case 'geoarrow.wkt':
      return 'wkt';
    case 'geometry':
    case 'geoarrow.point':
    case 'geoarrow.linestring':
    case 'geoarrow.polygon':
    case 'geoarrow.multipoint':
    case 'geoarrow.multilinestring':
    case 'geoarrow.multipolygon':
      throw new Error(
        `GeoArrow encoding "${encoding}" is not implemented for convertTableToGeoArrow`
      );
    default:
      throw new Error(`Unknown GeoArrow encoding "${encoding}"`);
  }
}

function inferFeatureGeometryTypes(features: Feature[]): string[] {
  const geometryTypes = new Set<string>();

  for (const feature of features) {
    if (!feature.geometry) {
      continue;
    }

    const dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(feature.geometry));
    geometryTypes.add(dimensions > 2 ? `${feature.geometry.type} Z` : feature.geometry.type);
  }

  return [...geometryTypes];
}

function normalizeProperties(properties: GeoJsonProperties): Record<string, unknown> {
  if (!properties || typeof properties !== 'object') {
    return {};
  }

  const normalizedProperties: Record<string, unknown> = {};
  for (const [propertyName, propertyValue] of Object.entries(properties)) {
    normalizedProperties[propertyName] = normalizePropertyValue(propertyValue);
  }
  return normalizedProperties;
}

function getPropertySchema(propertyRows: Record<string, unknown>[]): Schema {
  if (propertyRows.length === 0) {
    return {fields: [], metadata: {}};
  }

  const fieldNames = getFieldNames(propertyRows);
  return {
    metadata: {},
    fields: fieldNames.map((fieldName): Field => {
      const inferredType = getDataTypeFromArray(
        propertyRows.map(propertyRow => propertyRow[fieldName])
      );
      return {
        name: fieldName,
        type: inferredType.type === 'float32' ? 'float64' : inferredType.type,
        nullable: inferredType.nullable
      };
    })
  };
}

function getGeometryWKBOptions(geometry: Geometry): {hasZ?: boolean; hasM?: boolean} {
  const dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(geometry));
  return {
    hasZ: dimensions > 2,
    hasM: dimensions > 3
  };
}

function getCoordinateDimensions(coordinates: unknown): number {
  if (!Array.isArray(coordinates)) {
    return 2;
  }

  if (typeof coordinates[0] === 'number') {
    return coordinates.length;
  }

  if (coordinates.length === 0) {
    return 2;
  }

  return getCoordinateDimensions(coordinates[0]);
}

function getGeometrySampleCoordinates(geometry: Geometry): unknown {
  if ('coordinates' in geometry) {
    return geometry.coordinates;
  }

  if ('geometries' in geometry && geometry.geometries.length > 0) {
    return getGeometrySampleCoordinates(geometry.geometries[0]);
  }

  return undefined;
}

function normalizePropertyValue(propertyValue: unknown): unknown {
  if (
    propertyValue === null ||
    propertyValue === undefined ||
    typeof propertyValue === 'string' ||
    typeof propertyValue === 'number' ||
    typeof propertyValue === 'boolean'
  ) {
    return propertyValue ?? null;
  }

  if (propertyValue instanceof Date) {
    return propertyValue.toISOString();
  }

  return JSON.stringify(propertyValue);
}

function getFieldNames(propertyRows: Record<string, unknown>[]): string[] {
  const fieldNames = new Set<string>();
  for (const propertyRow of propertyRows) {
    for (const fieldName of Object.keys(propertyRow)) {
      fieldNames.add(fieldName);
    }
  }
  return [...fieldNames];
}
