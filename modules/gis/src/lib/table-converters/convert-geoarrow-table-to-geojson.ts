// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Feature, GeoArrowEncoding, GeoJSONTable, Geometry, Schema} from '@loaders.gl/schema';
import {convertWKBToGeometry} from '../geometry-converters/wkb/convert-wkb-to-geometry';
import {convertWKTToGeometry} from '../geometry-converters/wkb/convert-wkt-to-geometry';
import {getGeoArrowNativeGeometry} from '../geoarrow/get-geoarrow-native-geometry';
import {getGeoMetadata} from '../geoarrow/geoparquet-metadata';

/**
 * Converts an Arrow table with GeoArrow geometry metadata to a GeoJSON table.
 * @param arrowTable Apache Arrow table containing geometry and property columns.
 * @param schema loaders.gl schema associated with the Arrow table.
 * @returns A GeoJSON feature collection table.
 */
export function convertGeoArrowTableToGeoJSON(
  arrowTable: arrow.Table,
  schema: Schema
): GeoJSONTable {
  const geoMetadata = getGeoMetadata(schema.metadata);
  const primaryColumnName = geoMetadata?.primary_column;
  const primaryColumnExists = arrowTable.schema.fields.some(
    field => field.name === primaryColumnName
  );
  const geometryColumnName =
    (primaryColumnExists ? primaryColumnName : null) ||
    arrowTable.schema.fields.find(
      field =>
        geoMetadata?.columns?.[field.name]?.encoding ||
        getGeoArrowEncoding(field.metadata?.get('ARROW:extension:name'))
    )?.name;
  if (!geometryColumnName) {
    throw new Error('No GeoArrow geometry column found in schema');
  }

  const geometryField = arrowTable.schema.fields.find(field => field.name === geometryColumnName);
  const geometryColumn = arrowTable.getChild(geometryColumnName);
  if (!geometryField || !geometryColumn) {
    throw new Error(`Could not find GeoArrow geometry column "${geometryColumnName}"`);
  }

  const encoding = resolveGeoArrowEncoding(
    geoMetadata?.columns?.[geometryColumnName]?.encoding,
    geometryField.metadata?.get('ARROW:extension:name')
  );
  if (!encoding) {
    throw new Error(`No GeoArrow encoding found for column "${geometryColumnName}"`);
  }

  const propertyColumnNames = arrowTable.schema.fields
    .map(field => field.name)
    .filter(name => name !== geometryColumnName);
  const propertyColumns = propertyColumnNames.map(name => arrowTable.getChild(name));
  const features: Feature[] = [];

  for (let rowIndex = 0; rowIndex < arrowTable.numRows; rowIndex++) {
    const properties: Record<string, unknown> = {};
    propertyColumnNames.forEach((name, columnIndex) => {
      properties[name] = propertyColumns[columnIndex]?.get(rowIndex);
    });
    features.push({
      type: 'Feature',
      geometry: convertGeoArrowCellToGeometry(
        geometryColumn,
        rowIndex,
        encoding
      ) as Feature['geometry'],
      properties
    });
  }

  return {shape: 'geojson-table', type: 'FeatureCollection', schema, features};
}

/** Converts a GeoArrow vector cell into a GeoJSON geometry. */
function convertGeoArrowCellToGeometry(
  geometryColumn: arrow.Vector,
  rowIndex: number,
  encoding: GeoArrowEncoding
): Geometry | null {
  const value = geometryColumn.get(rowIndex);
  if (value == null) {
    return null;
  }
  if (encoding === 'geoarrow.wkb') {
    return convertWKBToGeometry(normalizeArrayBuffer(value as ArrayBufferLike | ArrayBufferView));
  }
  if (encoding === 'geoarrow.wkt') {
    return convertWKTToGeometry(value as string) || null;
  }
  return getGeoArrowNativeGeometry(geometryColumn, rowIndex, encoding) as Geometry | null;
}

/** Normalizes an ArrayBuffer view to the exact byte range it represents. */
function normalizeArrayBuffer(value: ArrayBufferLike | ArrayBufferView): ArrayBufferLike {
  if (!ArrayBuffer.isView(value)) {
    return value;
  }
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
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
  switch (value) {
    case 'wkb':
      return 'geoarrow.wkb';
    case 'wkt':
      return 'geoarrow.wkt';
    case 'geoarrow.point':
    case 'geoarrow.linestring':
    case 'geoarrow.polygon':
    case 'geoarrow.multipoint':
    case 'geoarrow.multilinestring':
    case 'geoarrow.multipolygon':
    case 'geoarrow.wkb':
    case 'geoarrow.wkt':
    case 'geoarrow.geometry':
    case 'geoarrow.geometrycollection':
      return value;
    default:
      return null;
  }
}
