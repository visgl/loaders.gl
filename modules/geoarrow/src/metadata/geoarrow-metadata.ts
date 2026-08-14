// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Metadata, SchemaWithMetadata, getMetadataValue} from './metadata-utils';
import type {GeoArrowEncoding, GeoArrowMetadata} from '@loaders.gl/gis';
import {GeoArrowMetadataSchema} from '@loaders.gl/gis/geospatial-metadata-zod-schema';

export type {GeoArrowEncoding, GeoArrowMetadata} from '@loaders.gl/gis';

/** Array containing all encodings */
const GEOARROW_ENCODINGS = [
  'geoarrow.geometry',
  'geoarrow.geometrycollection',
  'geoarrow.multipolygon',
  'geoarrow.polygon',
  'geoarrow.multilinestring',
  'geoarrow.linestring',
  'geoarrow.multipoint',
  'geoarrow.point',
  'geoarrow.box',
  'geoarrow.wkb',
  'geoarrow.wkt'
] as const satisfies GeoArrowEncoding[];

const GEOARROW_ENCODING = 'ARROW:extension:name';
const GEOARROW_METADATA = 'ARROW:extension:metadata';

/**
 * get geometry columns from arrow table
 */
export function getGeometryColumnsFromSchema(
  schema: SchemaWithMetadata
): Record<string, GeoArrowMetadata> {
  const geometryColumns: Record<string, GeoArrowMetadata> = {};
  for (const field of schema.fields || []) {
    const metadata = getGeometryMetadataForField(field?.metadata || {});
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
export function getGeometryMetadataForField(fieldMetadata: Metadata): GeoArrowMetadata | null {
  let metadata: GeoArrowMetadata | null = null;

  // Check for GeoArrow column encoding
  let geoEncoding = getMetadataValue(fieldMetadata, GEOARROW_ENCODING);
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
  const columnMetadata = getMetadataValue(fieldMetadata, GEOARROW_METADATA);
  if (columnMetadata) {
    try {
      const parsedMetadata = GeoArrowMetadataSchema.parse(JSON.parse(columnMetadata));
      metadata = {
        ...(metadata || {}),
        ...parsedMetadata
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse GeoArrow metadata', error);
    }
  }

  return metadata || null;
}
