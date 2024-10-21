// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import {Metadata, getMetadataKey, setMetadataKey} from './metadata-utils';

/**
 * A geoarrow / geoparquet geo metadata object
 * (stored in stringified form in the top level metadata 'geo' key)
 * @see https://github.com/opengeospatial/geoparquet/blob/main/format-specs/geoparquet.md
 * @see https://github.com/geoarrow/geoarrow
 * */
export type GeoMetadata = {
  version?: string;
  primary_column?: string;
  columns: Record<string, GeoColumnMetadata>;
  [key: string]: unknown;
};

/** A geoarrow / geoparquet geo metadata for one geometry column  */
export type GeoColumnMetadata = {
  encoding: 'wkb' | 'wkt';
  geometry_types: GeoParquetGeometryType[];
  crs?: object | null;
  orientation?: 'counterclockwise';
  bbox?: [number, number, number, number] | [number, number, number, number, number, number];
  edges?: 'planar' | 'spherical';
  epoch?: number;
  [key: string]: unknown;
};

/** A GeoParquet metadata geometry type */
export type GeoParquetGeometryType =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection'
  | 'Point Z'
  | 'LineString Z'
  | 'Polygon Z'
  | 'MultiPoint Z'
  | 'MultiLineString Z'
  | 'MultiPolygon Z'
  | 'GeometryCollection Z';

// GEO METADATA

/**
 * Reads the GeoMetadata object from the metadata
 * @note geoarrow / parquet schema is stringified into a single key-value pair in the parquet metadata
 */
export function getGeoMetadata(metadata: Metadata): GeoMetadata | null {
  const stringifiedGeoMetadata = getMetadataKey(metadata, 'geo');
  const geoMetadata = stringifiedGeoMetadata && parseJSONStringMetadata(stringifiedGeoMetadata);
  if (!geoMetadata) {
    return null;
  }
  for (const column of Object.values(geoMetadata.columns || {})) {
    if (column.encoding) {
      column.encoding = column.encoding.toLowerCase();
    }
  }
  return geoMetadata as GeoMetadata;
}

/**
 * Stores a geoarrow / geoparquet geo metadata object in the schema
 * @note geoarrow / geoparquet geo metadata is a single stringified JSON field
 */
export function setGeoMetadata(metadata: Metadata, geoMetadata: GeoMetadata): void {
  const stringifiedGeoMetadata = JSON.stringify(geoMetadata);
  setMetadataKey(metadata, 'geo', stringifiedGeoMetadata);
}

/**
 * Unpacks geo metadata into separate metadata fields (parses the long JSON string)
 * @note geoarrow / parquet schema is stringified into a single key-value pair in the parquet metadata
 */
export function unpackGeoMetadata(metadata: Metadata): void {
  const geoMetadata = getGeoMetadata(metadata);
  if (!geoMetadata) {
    return;
  }

  // Store Parquet Schema Level Metadata

  const {version, primary_column, columns} = geoMetadata;
  if (version) {
    setMetadataKey(metadata, 'geo.version', version);
  }

  if (primary_column) {
    setMetadataKey(metadata, 'geo.primary_column', primary_column);
  }

  // store column names as comma separated list
  setMetadataKey(metadata, 'geo.columns', Object.keys(columns || {}).join(''));

  // for (const [columnName, columnMetadata] of Object.entries(columns || {})) {
  //   const field = schema.fields.find((field) => field.name === columnName);
  //   if (field) {
  //     if (field.name === primary_column) {
  //       setFieldMetadata(field, 'geo.primary_field', 'true');
  //     }
  //     unpackGeoFieldMetadata(field, columnMetadata);
  //   }
  // }
}

export function unpackJSONStringMetadata(metadata: Metadata, metadataKey: string): void {
  const stringifiedGeoMetadata = getMetadataKey(metadata, 'geo');
  const json = stringifiedGeoMetadata && parseJSONStringMetadata(stringifiedGeoMetadata);
  for (const [key, value] of Object.entries(json || {})) {
    setMetadataKey(
      metadata,
      `${metadataKey}.${key}`,
      typeof value === 'string' ? value : JSON.stringify(value)
    );
  }
}

// eslint-disable-next-line complexity
// function unpackGeoFieldMetadata(fieldMetadata: Metadata, columnMetadata): void {
//   for (const [key, value] of Object.entries(columnMetadata || {})) {
//     switch (key) {
//       case 'geometry_types':
//         setFieldMetadata(field, `geo.${key}`, (value as string[]).join(','));
//         break;
//       case 'bbox':
//         setFieldMetadata(field, `geo.crs.${key}`, JSON.stringify(value));
//         break;
//       case 'crs':
//         // @ts-ignore
//         for (const [crsKey, crsValue] of Object.entries(value || {})) {
//           switch (crsKey) {
//             case 'id':
//               // prettier-ignore
//               const crsId =
//                 typeof crsValue === 'object'
//                   ? // @ts-ignore
//                   `${crsValue?.authority}:${crsValue?.code}`
//                   : JSON.stringify(crsValue);
//               setFieldMetadata(field, `geo.crs.${crsKey}`, crsId);
//               break;
//             default:
//               setFieldMetadata(
//                 field,
//                 `geo.crs.${crsKey}`,
//                 typeof crsValue === 'string' ? crsValue : JSON.stringify(crsValue)
//               );
//               break;
//           }
//         }
//         break;
//       case 'edges':
//       default:
//         setFieldMetadata(
//           field,
//           `geo.${key}`,
//           typeof value === 'string' ? value : JSON.stringify(value)
//         );
//     }
//   }
// }

// function setFieldMetadata(field: Field, key: string, value: string): void {
//   field.metadata = field.metadata || {};
//   field.metadata[key] = value;
// }

// HELPERS

/** Parse a key with stringified arrow metadata */
export function parseJSONStringMetadata(
  stringifiedMetadata: string
): Record<string, unknown> | null {
  if (!stringifiedMetadata) {
    return null;
  }

  try {
    const metadata = JSON.parse(stringifiedMetadata);
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    return metadata;
  } catch {
    return null;
  }
}
