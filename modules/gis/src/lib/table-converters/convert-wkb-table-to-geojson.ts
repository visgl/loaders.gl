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

import {GeoColumnMetadata, getGeoMetadata} from '../geoarrow/geoparquet-metadata';
import {convertWKBToGeometry} from '../geometry-converters/wkt/convert-wkb-to-geometry';
import {convertWKTToGeometry} from '../geometry-converters/wkt/convert-wkt-to-geometry';

/**
 * Convert a table with WKB geometry column to a GeoJSON table
 * @param table
 * @param schema
 * @returns
 */
export function convertWKBTableToGeoJSON(
  table: ArrayRowTable | ObjectRowTable,
  schema: Schema
): GeoJSONTable {
  const geoMetadata = getGeoMetadata(schema);
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
    const feature: Feature = {type: 'Feature', geometry: geometry!, properties: row};
    features.push(feature);
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
