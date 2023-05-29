// loaders.gl, MIT license
import {Schema, Field} from '@loaders.gl/schema';

/* eslint-disable camelcase */

/** A geoarrow / geoparquet geo metadata object (stored in stringified form in the top level metadata 'geo' key) */
export type GeoMetadata = {
  version?: string;
  primary_column?: string;
  columns: Record<string, GeoColumnMetadata>;
  [key: string]: unknown;
};

/** A geoarrow / geoparquet geo metadata for one geometry column  */
export type GeoColumnMetadata = {
  bounding_box?:
    | [number, number, number, number]
    | [number, number, number, number, number, number];
  crs?: string;
  geometry_type?: string[];
  edges?: string;
  [key: string]: unknown;
};

/**
 * Reads the GeoMetadata object from the metadata
 * @note geoarrow / parquet schema is stringified into a single key-value pair in the parquet metadata */
export function getGeoMetadata(schema: Schema): GeoMetadata | null {
  const stringifiedGeoMetadata = schema.metadata.geo;
  if (!stringifiedGeoMetadata) {
    return null;
  }

  try {
    const geoMetadata = JSON.parse(stringifiedGeoMetadata) as GeoMetadata;
    return geoMetadata;
  } catch {
    return null;
  }
}

/**
 * Stores a geoarrow / geoparquet geo metadata object in the schema
 * @note geoarrow / geoparquet geo metadata is a single stringified JSON field
 */
export function setGeoMetadata(schema: Schema, geoMetadata: GeoMetadata): void {
  const stringifiedGeoMetadata = JSON.stringify(geoMetadata);
  schema.metadata.geo = stringifiedGeoMetadata;
}

/**
 * Unpacks geo metadata into separate metadata fields (parses the long JSON string)
 * @note geoarrow / parquet schema is stringified into a single key-value pair in the parquet metadata
 */
export function unpackGeoMetadata(schema: Schema): void {
  const geoMetadata = getGeoMetadata(schema);
  if (!geoMetadata) {
    return;
  }

  // Store Parquet Schema Level Metadata

  const {version, primary_column, columns} = geoMetadata;
  if (version) {
    schema.metadata['geo.version'] = version;
  }

  if (primary_column) {
    schema.metadata['geo.primary_column'] = primary_column;
  }

  // store column names as comma separated list
  schema.metadata['geo.columns'] = Object.keys(columns || {}).join('');

  for (const [columnName, columnMetadata] of Object.entries(columns || {})) {
    const field = schema.fields.find((field) => field.name === columnName);
    if (field) {
      if (field.name === primary_column) {
        setFieldMetadata(field, 'geo.primary_field', 'true');
      }
      unpackGeoFieldMetadata(field, columnMetadata);
    }
  }
}

function unpackGeoFieldMetadata(field: Field, columnMetadata): void {
  for (const [key, value] of Object.entries(columnMetadata || {})) {
    switch (key) {
      case 'geometry_type':
        setFieldMetadata(field, `geo.${key}`, (value as string[]).join(','));
        break;
      case 'bbox':
      case 'crs':
      case 'edges':
      default:
        setFieldMetadata(
          field,
          `geo.${key}`,
          typeof value === 'string' ? value : JSON.stringify(value)
        );
    }
  }
}

function setFieldMetadata(field: Field, key: string, value: string): void {
  field.metadata = field.metadata || {};
  field.metadata[key] = value;
}
