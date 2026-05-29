// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, Feature, Field, GeoJsonProperties, Schema} from '@loaders.gl/schema';
import {ArrowTableBuilder, getDataTypeFromArray} from '@loaders.gl/schema-utils';
import {
  encodeWKBGeometryValue,
  inferGeoParquetGeometryTypes,
  makeWKBGeometryField,
  setWKBGeometrySchemaMetadata
} from './wkb-geoarrow-utils';

const GEOMETRY_COLUMN_NAME = 'geometry';

/**
 * Converts GeoJSON features into a loaders.gl Arrow table with a GeoArrow WKB geometry column.
 *
 * @param features - GeoJSON features.
 * @returns Arrow table preserving feature properties and storing geometry as WKB bytes.
 */
export function convertFeaturesToWKBArrowTable(features: Feature[]): ArrowTable {
  const propertyRows = features.map(feature => normalizeProperties(feature.properties));
  const propertySchema = getPropertySchema(propertyRows);
  const schema = buildFeatureArrowSchema(propertySchema, features);
  const arrowTableBuilder = new ArrowTableBuilder(schema);

  for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
    arrowTableBuilder.addObjectRow({
      ...propertyRows[featureIndex],
      [GEOMETRY_COLUMN_NAME]: encodeWKBGeometryValue(features[featureIndex].geometry)
    });
  }

  return arrowTableBuilder.finishTable();
}

/**
 * Builds an Arrow schema for GeoJSON feature properties plus a GeoArrow WKB geometry column.
 *
 * @param propertySchema - Schema inferred from feature properties.
 * @param features - Features used to infer geometry metadata.
 * @returns Schema with the geometry column and GeoParquet metadata.
 */
export function buildFeatureArrowSchema(propertySchema: Schema, features: Feature[]): Schema {
  const geometryField: Field = makeWKBGeometryField(GEOMETRY_COLUMN_NAME);
  const schema: Schema = {
    fields: [...propertySchema.fields, geometryField],
    metadata: {...(propertySchema.metadata || {})}
  };

  setWKBGeometrySchemaMetadata(schema, {
    geometryColumnName: GEOMETRY_COLUMN_NAME,
    geometryTypes: inferGeoParquetGeometryTypes(features.map(feature => feature.geometry))
  });

  return schema;
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

function getFieldNames(propertyRows: Record<string, unknown>[]): string[] {
  const fieldNames = new Set<string>();
  for (const propertyRow of propertyRows) {
    for (const fieldName of Object.keys(propertyRow)) {
      fieldNames.add(fieldName);
    }
  }
  return [...fieldNames];
}
