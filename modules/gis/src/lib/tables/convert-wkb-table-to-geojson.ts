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

import {GeoColumnMetadata, getGeoMetadata} from '../geo/geoparquet-metadata';
import {parseWKB} from '../wkt/parse-wkb';
import {parseWKT} from '../wkt/parse-wkt';

/** TODO - move to loaders.gl/gis? */
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
      return parseWKT(geometry as string) || null;
    case 'wkb':
    default:
      const arrayBuffer = ArrayBuffer.isView(geometry)
        ? geometry.buffer.slice(geometry.byteOffset, geometry.byteOffset + geometry.byteLength)
        : (geometry as ArrayBuffer);
      const geojson = parseWKB(arrayBuffer, {shape: 'geojson-geometry'}) as unknown as Geometry;
      return geojson; // binaryGeometry ? binaryToGeometry(binaryGeometry) : null;
    // const binaryGeometry = WKBLoader.parseSync?.(geometry);
    // ts-ignore
    // return binaryGeometry ? binaryToGeometry(binaryGeometry) : null;
  }
}
