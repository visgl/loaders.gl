// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  Feature,
  GeoArrowEncoding,
  GeoJSONTable,
  Geometry,
  Schema
} from '@loaders.gl/core/schema';
import {convertWKBToGeometry} from './geometry-codecs';
import {convertWKTToGeometry} from './geometry-codecs';
import {makeGeoArrowColumnFromArrowVector} from '@math.gl/arrow/geoarrow';
import {materializeGeoArrowRows} from '@math.gl/arrow/geoarrow-utils';
import {convertArrowToSchema} from '../schema-utils/lib/schema/convert-arrow-schema';
import {getGeoMetadata} from '@loaders.gl/core/schema';

/**
 * Converts an Arrow table with GeoArrow geometry metadata to a GeoJSON table.
 * Integer properties are serialized as decimal strings to preserve their precision.
 * @param arrowTable Apache Arrow table containing geometry and property columns.
 * @param schema Optional schema override. Defaults to the metadata on the Arrow table.
 * @returns A GeoJSON feature collection table.
 */
export function convertGeoArrowTableToGeoJSON(
  arrowTable: arrow.Table,
  schema: Schema = convertArrowToSchema(arrowTable.schema)
): GeoJSONTable {
  const geoMetadata = getGeoMetadata(schema.metadata);
  const geometryFields = getGeoArrowGeometryFields(arrowTable.schema, schema);
  const primaryGeometry =
    geometryFields.find(entry => entry.field.name === geoMetadata?.primary_column) ||
    geometryFields[0];
  if (!primaryGeometry) {
    throw new Error('No GeoArrow geometry column found in schema');
  }
  const {field: geometryField, encoding} = primaryGeometry;
  const geometryColumn = arrowTable.getChild(geometryField.name);
  if (!geometryColumn) {
    throw new Error(`Could not find GeoArrow geometry column "${geometryField.name}"`);
  }
  const geometryColumnNames = new Set(geometryFields.map(entry => entry.field.name));
  const propertyColumnNames = arrowTable.schema.fields
    .filter(field => !geometryColumnNames.has(field.name))
    .map(field => field.name);
  const propertyColumns = propertyColumnNames.map(name => arrowTable.getChild(name));
  const geometries = decodeGeoArrowGeometryColumn(geometryColumn, encoding);
  const features: Feature[] = [];

  for (let rowIndex = 0; rowIndex < arrowTable.numRows; rowIndex++) {
    const properties: Record<string, unknown> = {};
    propertyColumnNames.forEach((name, columnIndex) => {
      properties[name] = normalizeGeoJSONProperty(propertyColumns[columnIndex]?.get(rowIndex));
    });
    features.push({
      type: 'Feature',
      geometry: geometries[rowIndex] as Feature['geometry'],
      properties
    });
  }

  return {shape: 'geojson-table', type: 'FeatureCollection', schema, features};
}

/** Identifies the Arrow fields that declare a supported geometry encoding. */
export function getGeoArrowGeometryFields(schema: arrow.Schema, tableSchema: Schema) {
  const geoMetadata = getGeoMetadata(tableSchema.metadata);
  return schema.fields
    .map(field => ({
      field,
      encoding: resolveGeoArrowEncoding(
        geoMetadata?.columns?.[field.name]?.encoding,
        field.metadata?.get('ARROW:extension:name')
      )
    }))
    .filter(
      (entry): entry is {field: arrow.Field; encoding: GeoArrowEncoding} => entry.encoding !== null
    );
}

/** Decodes an encoded or native GeoArrow column into GeoJSON geometry values. */
export function decodeGeoArrowGeometryColumn(column: arrow.Vector, encoding: GeoArrowEncoding) {
  return encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt'
    ? Array.from({length: column.length}, (_, index) =>
        convertGeoArrowCellToGeometry(column, index, encoding)
      )
    : materializeGeoArrowRows(makeGeoArrowColumnFromArrowVector(column, {encoding}));
}

/** Converts a GeoArrow vector cell into a GeoJSON geometry. */
function convertGeoArrowCellToGeometry(
  geometryColumn: arrow.Vector,
  rowIndex: number,
  encoding: 'geoarrow.wkb' | 'geoarrow.wkt'
): Geometry | null {
  const value = geometryColumn.get(rowIndex);
  if (value == null) {
    return null;
  }
  if (encoding === 'geoarrow.wkb') {
    return convertWKBToGeometry(value as ArrayBufferLike | ArrayBufferView);
  }
  return convertWKTToGeometry(value as string) || null;
}

/** Resolves recognized GeoArrow extension names. */
function resolveGeoArrowEncoding(...values: unknown[]): GeoArrowEncoding | null {
  for (const value of values) {
    const encoding = getGeoArrowEncoding(value);
    if (encoding) {
      return encoding;
    }
  }
  return null;
}

/** Resolves recognized GeoArrow extension or GeoParquet encoding names. */
function getGeoArrowEncoding(value: unknown): GeoArrowEncoding | null {
  const encoding =
    typeof value === 'string'
      ? value
          .trim()
          .toLowerCase()
          .replace(/^geoarrow\./, '')
      : null;
  switch (encoding) {
    case 'wkb':
      return 'geoarrow.wkb';
    case 'wkt':
      return 'geoarrow.wkt';
    case 'point':
    case 'linestring':
    case 'polygon':
    case 'multipoint':
    case 'multilinestring':
    case 'multipolygon':
    case 'geometry':
    case 'geometrycollection':
      return `geoarrow.${encoding}`;
    default:
      return null;
  }
}

/** Converts nested Arrow property values into JSON-compatible values without losing integer precision. */
function normalizeGeoJSONProperty(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value == null) {
    return null;
  }
  if (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))) {
    return Array.from(value as ArrayLike<unknown>, normalizeGeoJSONProperty);
  }
  if (typeof value === 'object') {
    if ('toJSON' in value && typeof value.toJSON === 'function') {
      return normalizeGeoJSONProperty(value.toJSON());
    }
    return Object.fromEntries(
      Object.entries(value).map(([name, child]) => [name, normalizeGeoJSONProperty(child)])
    );
  }
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}
