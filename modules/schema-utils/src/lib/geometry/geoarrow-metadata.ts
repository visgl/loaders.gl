// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Field, GeoArrowMetadata, GeoArrowEncoding} from '@loaders.gl/schema';

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
] as const satisfies GeoArrowEncoding[];

const GEOARROW_ENCODING = 'ARROW:extension:name';
const GEOARROW_METADATA = 'ARROW:extension:metadata';

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
  let geoEncoding = field.metadata?.[GEOARROW_ENCODING];
  if (geoEncoding) {
    geoEncoding = geoEncoding.toLowerCase();
    // at time of testing, ogr2ogr uses WKB/WKT for encoding.
    if (geoEncoding === 'wkb') {
      geoEncoding = 'geoarrow.wkb';
    }
    if (geoEncoding === 'wkt') {
      geoEncoding = 'geoarrow.wkt';
    }
    if (!GEOARROW_ENCODINGS.includes(geoEncoding as GeoArrowEncoding)) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid GeoArrow encoding: ${geoEncoding}`);
    } else {
      metadata ||= {} as GeoArrowMetadata;
      metadata.encoding = geoEncoding as GeoArrowEncoding;
    }
  }

  // Check for GeoArrow metadata
  const columnMetadata = field.metadata?.[GEOARROW_METADATA];
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
