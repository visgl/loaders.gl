// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  Feature,
  GeoJSONTable,
  Geometry,
  ObjectRowTable,
  Schema
} from '@loaders.gl/schema';
import {getTableLength, getTableRowAsObject} from '@loaders.gl/schema-utils';
import type {GeoColumnMetadata} from '../geoarrow/geoparquet-metadata';
import {getGeoMetadata} from '../geoarrow/geoparquet-metadata';
import {convertWKBToGeometry} from '../geometry-converters/wkb/convert-wkb-to-geometry';
import {convertWKTToGeometry} from '../geometry-converters/wkb/convert-wkt-to-geometry';

/**
 * Converts a WKB- or WKT-encoded table with GeoParquet-style metadata to a GeoJSON table.
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

  const columnMetadata = geoMetadata.columns?.[primaryColumn];
  if (!columnMetadata) {
    throw new Error(`missing metadata for geometry column "${primaryColumn}"`);
  }

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
  switch (columnMetadata.encoding?.toLowerCase()) {
    case 'wkt':
      return convertWKTToGeometry(geometry as string) || null;

    case 'wkb':
    default: {
      const arrayBuffer = ArrayBuffer.isView(geometry)
        ? geometry.buffer.slice(geometry.byteOffset, geometry.byteOffset + geometry.byteLength)
        : (geometry as ArrayBuffer);
      return convertWKBToGeometry(arrayBuffer);
    }
  }
}
