// loaders.gl, MIT license

import type {ArrayRowTable, GeoJSONTable, ObjectRowTable, Schema} from '@loaders.gl/schema';
import type {Feature, Geometry} from '@loaders.gl/schema';
import {getTableLength, getTableRowAsObject} from '@loaders.gl/schema';
// import {binaryToGeometry} from '@loaders.gl/gis';
import {HexWKBLoader, WKTLoader} from '@loaders.gl/wkt';

import {GeoColumnMetadata, getGeoMetadata} from './decode-geo-metadata';

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
    const geometry = parseGeometry(row[primaryColumn] as string, columnMetadata);
    delete row[primaryColumn];
    const feature: Feature = {type: 'Feature', geometry: geometry!, properties: row};
    features.push(feature);
  }

  return {shape: 'geojson-table', schema, type: 'FeatureCollection', features};
}

function parseGeometry(geometry: string, columnMetadata: GeoColumnMetadata): Geometry | null {
  switch (columnMetadata.encoding) {
    case 'wkt':
      return WKTLoader.parseTextSync?.(geometry) || null;
    case 'wkb':
    default:
      const geojson = HexWKBLoader.parseTextSync?.(geometry, {wkb: {shape: 'geometry'}}) as unknown as Geometry;
      return geojson; // binaryGeometry ? binaryToGeometry(binaryGeometry) : null;
  }
}
