// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {convertGeometryToWKB} from '@loaders.gl/gis';
import type {
  ArrowTable,
  Feature,
  Field,
  Geometry,
  GeoJsonProperties,
  Schema
} from '@loaders.gl/schema';
import {ArrowTableBuilder, getDataTypeFromArray} from '@loaders.gl/schema-utils';

const GEOMETRY_COLUMN_NAME = 'geometry';
const GEO_METADATA_VERSION = '1.1.0';

/**
 * Converts GeoJSON features into a loaders.gl Arrow table with WKB geometry metadata.
 *
 * @param features - Parsed GeoJSON features.
 * @returns Arrow table preserving properties and storing geometry as WKB bytes.
 */
export function convertFeatureCollectionToArrowTable(features: Feature[]): ArrowTable {
  const propertyRows = features.map(feature => normalizeProperties(feature.properties));
  const propertySchema = getPropertySchema(propertyRows);
  const schema = buildFeatureArrowSchema(propertySchema, features);
  const arrowTableBuilder = new ArrowTableBuilder(schema);

  for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
    arrowTableBuilder.addObjectRow(
      makeFeatureArrowRow(propertyRows[featureIndex], features[featureIndex])
    );
  }

  return arrowTableBuilder.finishTable();
}

/**
 * Builds the output Arrow schema for a feature table with a WKB geometry column.
 *
 * @param propertySchema - Schema inferred from feature properties.
 * @param features - Features used to infer geometry metadata.
 * @returns Output schema with appended geometry field and geo metadata.
 */
export function buildFeatureArrowSchema(propertySchema: Schema, features: Feature[]): Schema {
  const geometryField: Field = {
    name: GEOMETRY_COLUMN_NAME,
    type: 'binary',
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
            encoding: 'wkb',
            geometry_types: inferFeatureGeometryTypes(features)
          }
        }
      })
    }
  };
}

/**
 * Converts one feature into an object row suitable for `ArrowTableBuilder`.
 *
 * @param properties - Normalized feature properties.
 * @param feature - Feature containing optional geometry.
 * @returns Object row with a WKB geometry column.
 */
export function makeFeatureArrowRow(
  properties: Record<string, unknown>,
  feature: Feature
): Record<string, unknown> {
  return {
    ...properties,
    [GEOMETRY_COLUMN_NAME]: feature.geometry
      ? new Uint8Array(
          convertGeometryToWKB(feature.geometry, getGeometryWKBOptions(feature.geometry))
        )
      : null
  };
}

/**
 * Infers GeoParquet geometry type strings from a feature collection.
 *
 * @param features - Features to inspect.
 * @returns Unique geometry type strings in encounter order.
 */
export function inferFeatureGeometryTypes(features: Feature[]): string[] {
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

/**
 * Normalizes nullable GeoJSON properties to a plain object.
 *
 * @param properties - Feature properties value.
 * @returns Plain object safe for schema deduction and Arrow row building.
 */
export function normalizeProperties(properties: GeoJsonProperties): Record<string, unknown> {
  if (!properties || typeof properties !== 'object') {
    return {};
  }

  const normalizedProperties: Record<string, unknown> = {};
  for (const [propertyName, propertyValue] of Object.entries(properties)) {
    normalizedProperties[propertyName] = normalizePropertyValue(propertyValue);
  }
  return normalizedProperties;
}

/**
 * Deduces a property-only schema from normalized object rows.
 *
 * @param propertyRows - Normalized property rows.
 * @returns Property schema or an empty schema when no rows are present.
 */
export function getPropertySchema(propertyRows: Record<string, unknown>[]): Schema {
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

/**
 * Selects WKB dimensional flags based on the geometry coordinate dimensionality.
 *
 * @param geometry - Geometry to serialize.
 * @returns WKB options preserving Z and M ordinates when present.
 */
export function getGeometryWKBOptions(geometry: Geometry): {hasZ?: boolean; hasM?: boolean} {
  const dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(geometry));
  return {
    hasZ: dimensions > 2,
    hasM: dimensions > 3
  };
}

/**
 * Returns the coordinate dimensionality of a representative geometry coordinate tuple.
 *
 * @param coordinates - Geometry coordinates or nested coordinate arrays.
 * @returns Coordinate tuple length, defaulting to `2`.
 */
export function getCoordinateDimensions(coordinates: unknown): number {
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

/**
 * Extracts one representative coordinate payload from a geometry.
 *
 * @param geometry - Geometry to sample.
 * @returns Representative coordinates or `undefined` when the geometry is empty.
 */
export function getGeometrySampleCoordinates(geometry: Geometry): unknown {
  if ('coordinates' in geometry) {
    return geometry.coordinates;
  }

  if ('geometries' in geometry && geometry.geometries.length > 0) {
    return getGeometrySampleCoordinates(geometry.geometries[0]);
  }

  return undefined;
}

/**
 * Normalizes one property value to an Arrow-friendly scalar representation.
 *
 * Arrays and plain objects are preserved as JSON strings so nested content is not dropped by
 * schema inference.
 *
 * @param propertyValue - Original GeoJSON property value.
 * @returns Arrow-friendly scalar value.
 */
export function normalizePropertyValue(propertyValue: unknown): unknown {
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

/**
 * Collects stable field names in first-seen order across property rows.
 *
 * @param propertyRows - Normalized property rows.
 * @returns Field names in encounter order.
 */
function getFieldNames(propertyRows: Record<string, unknown>[]): string[] {
  const fieldNames = new Set<string>();
  for (const propertyRow of propertyRows) {
    for (const fieldName of Object.keys(propertyRow)) {
      fieldNames.add(fieldName);
    }
  }
  return [...fieldNames];
}
