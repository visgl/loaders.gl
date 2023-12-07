// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema, Field} from '@loaders.gl/schema';

export type GeoArrowEncoding =
  | 'geoarrow.multipolygon'
  | 'geoarrow.polygon'
  | 'geoarrow.multilinestring'
  | 'geoarrow.linestring'
  | 'geoarrow.multipoint'
  | 'geoarrow.point'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt';

/** Array containing all encodings */
const GEOARROW_ENCODINGS = [
  'geoarrow.multipolygon',
  'geoarrow.polygon',
  'geoarrow.multilinestring',
  'geoarrow.linestring',
  'geoarrow.multipoint',
  'geoarrow.point',
  'geoarrow.wkb',
  'geoarrow.wkt'
];

const GEOARROW_COLUMN_METADATA_ENCODING = 'ARROW:extension:name';
const GEOARROW_COLUMN_METADATA_METADATA = 'ARROW:extension:metadata';

/**
 * Geospatial metadata for one column, extracted from Apache Arrow metadata
 * @see https://github.com/geoarrow/geoarrow/blob/main/extension-types.md
 */
export type GeoArrowMetadata = {
  /** Encoding of geometry in this column */
  encoding?: GeoArrowEncoding;
  /** CRS in [PROJJSON](https://proj.org/specifications/projjson.html). Omitted if producer has no information about CRS */
  crs?: Record<string, unknown>;
  /** Edges are either spherical or omitted */
  edges?: 'spherical';
  [key: string]: unknown;
};

/**
 * get geometry columns from arrow table
 */
export function getGeometryColumnsFromSchema(schema: Schema): Record<string, GeoArrowMetadata> {
  const geometryColumns: Record<string, GeoArrowMetadata> = {};
  for (const field of schema.fields) {
    const metadata = getGeometryMetadataForField(field);
    if (metadata) {
      geometryColumns[field.name] = metadata;
    }
  }
  return geometryColumns;
}
/**
 * Extracts GeoArrow metadata from a field
 * @param field
 * @returns
 * @see https://github.com/geoarrow/geoarrow/blob/d2f56704414d9ae71e8a5170a8671343ed15eefe/extension-types.md
 */
export function getGeometryMetadataForField(field: Field): GeoArrowMetadata | null {
  let metadata: GeoArrowMetadata | null = null;

  // Check for GeoArrow column encoding
  let geoEncoding = field.metadata?.[GEOARROW_COLUMN_METADATA_ENCODING];
  if (geoEncoding) {
    geoEncoding = geoEncoding.toLowerCase();
    // at time of testing, ogr2ogr uses WKB/WKT for encoding.
    if (geoEncoding === 'wkb') {
      geoEncoding = 'geoarrow.wkb';
    }
    if (geoEncoding === 'wkt') {
      geoEncoding = 'geoarrow.wkt';
    }
    if (!GEOARROW_ENCODINGS.includes(geoEncoding)) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid GeoArrow encoding: ${geoEncoding}`);
    } else {
      metadata = metadata || ({} as GeoArrowMetadata);
      metadata.encoding = geoEncoding as GeoArrowEncoding;
    }
  }

  // Check for GeoArrow metadata
  const columnMetadata = field.metadata?.[GEOARROW_COLUMN_METADATA_METADATA];
  if (columnMetadata) {
    try {
      metadata = JSON.parse(columnMetadata);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse GeoArrow metadata', error);
    }
  }

  return metadata || null;
}
