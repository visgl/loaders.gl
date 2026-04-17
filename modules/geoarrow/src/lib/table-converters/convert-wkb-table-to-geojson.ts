// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  GeoJSONTable,
  ObjectRowTable,
  Schema,
  Feature,
  Geometry
} from '@loaders.gl/schema';
import {getTableLength, getTableRowAsObject} from '@loaders.gl/schema-utils';
import {convertWKBToGeometry, convertWKTToGeometry} from '@loaders.gl/gis';
import type {GeoColumnMetadata} from '../../metadata/geoparquet-metadata';
import {getGeoMetadata} from '../../metadata/geoparquet-metadata';

/**
 * Converts a WKB- or WKT-encoded table with geo metadata to GeoJSON features.
 */
export function convertWKBTableToGeoJSON(
  table: ArrayRowTable | ObjectRowTable,
  schema: Schema
): GeoJSONTable {
  const geoMetadata = getGeoMetadata(schema.metadata);
  const primaryColumn = geoMetadata?.primary_column;
  if (!primaryColumn) {
    throw new Error('no geometry column');
  }
  const columnMetadata = geoMetadata.columns[primaryColumn];

  const features: Feature[] = [];
  const length = getTableLength(table);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    const row = getTableRowAsObject(table, rowIndex);
    const geometry = parseGeometry(row[primaryColumn], columnMetadata);
    delete row[primaryColumn];
    features.push({type: 'Feature', geometry: geometry!, properties: row});
  }

  return {shape: 'geojson-table', schema, type: 'FeatureCollection', features};
}

function parseGeometry(geometry: unknown, columnMetadata: GeoColumnMetadata): Geometry | null {
  switch (columnMetadata.encoding) {
    case 'wkt':
      return convertWKTToGeometry(geometry as string) || null;
    case 'wkb':
    default:
      const arrayBuffer = ArrayBuffer.isView(geometry)
        ? geometry.buffer.slice(geometry.byteOffset, geometry.byteOffset + geometry.byteLength)
        : (geometry as ArrayBuffer);
      return convertWKBToGeometry(arrayBuffer);
  }
}
