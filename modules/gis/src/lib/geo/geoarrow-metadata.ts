// loaders.gl, MIT license
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

const GEOARROW_METADATA_COLUMN_ENCODING = 'ARROW:extension:name';
const GEOARROW_METADATA_COLUMN_METADATA = 'ARROW:extension:metadata';

/** Column metadata extracted from Apache Arrow metadata */
type GeoArrowMetadata = {
  encoding?: GeoArrowEncoding;
  crs?: Record<string, unknown>;
  egdes?: 'spherical';
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

export function getGeometryMetadataForField(field: Field): GeoArrowMetadata | null {
  let metadata: GeoArrowMetadata | null = null;

  // Check for GeoArrow metadata
  const columnMetadata = field.metadata?.[GEOARROW_METADATA_COLUMN_METADATA];
  if (columnMetadata) {
    try {
      metadata = JSON.parse(columnMetadata);
    } catch (error) {
      console.warn('Failed to parse GeoArrow metadata', error);
    }
  }

  // Check for GeoArrow column encoding
  let geoEncoding = field.metadata?.[GEOARROW_METADATA_COLUMN_ENCODING];
  if (geoEncoding) {
    geoEncoding = geoEncoding.toLowerCase();
    if (!GEOARROW_ENCODINGS.includes(geoEncoding)) {
      console.warn(`Invalid GeoArrow encoding: ${geoEncoding}`);
    } else {
      metadata = metadata || ({} as GeoArrowMetadata);
      metadata.encoding = geoEncoding as GeoArrowEncoding;
    }
  }

  return metadata || null;
}
