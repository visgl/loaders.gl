// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import {getMetadataValue, type Metadata, setMetadataValue} from './metadata-utils';

/**
 * A GeoParquet metadata object stored in the top-level `geo` schema metadata key.
 */
export type GeoMetadata = {
  version?: string;
  primary_column?: string;
  columns: Record<string, GeoColumnMetadata>;
  [key: string]: unknown;
};

/**
 * GeoParquet metadata for one geometry column.
 */
export type GeoColumnMetadata = {
  encoding:
    | 'wkb'
    | 'wkt'
    | 'point'
    | 'linestring'
    | 'polygon'
    | 'multipoint'
    | 'multilinestring'
    | 'multipolygon';
  geometry_types: GeoParquetGeometryType[];
  crs?: object | null;
  crs_type?: 'projjson' | 'wkt2:2019';
  orientation?: 'counterclockwise';
  bbox?: [number, number, number, number] | [number, number, number, number, number, number];
  edges?: 'planar' | 'spherical';
  epoch?: number;
  [key: string]: unknown;
};

/**
 * Geometry type strings used by GeoParquet metadata.
 */
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

/**
 * Reads GeoParquet metadata from a metadata container.
 *
 * @param metadata - Schema metadata container.
 * @returns Parsed GeoParquet metadata or `null`.
 */
export function getGeoMetadata(metadata: Metadata | undefined): GeoMetadata | null {
  if (!metadata) {
    return null;
  }

  const stringifiedGeoMetadata = getMetadataValue(metadata, 'geo');
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
 * Stores GeoParquet metadata in the top-level `geo` schema metadata key.
 *
 * @param metadata - Schema metadata container.
 * @param geoMetadata - Metadata value to store.
 */
export function setGeoMetadata(metadata: Metadata, geoMetadata: GeoMetadata): void {
  setMetadataValue(metadata, 'geo', JSON.stringify(geoMetadata));
}

/**
 * Unpacks top-level GeoParquet metadata into flattened metadata entries.
 *
 * @param metadata - Schema metadata container.
 */
export function unpackGeoMetadata(metadata: Metadata): void {
  const geoMetadata = getGeoMetadata(metadata);
  if (!geoMetadata) {
    return;
  }

  const {version, primary_column, columns} = geoMetadata;
  if (version) {
    setMetadataValue(metadata, 'geo.version', version);
  }

  if (primary_column) {
    setMetadataValue(metadata, 'geo.primary_column', primary_column);
  }

  setMetadataValue(metadata, 'geo.columns', Object.keys(columns || {}).join(','));
}

/**
 * Unpacks one JSON-encoded metadata value into flattened metadata entries.
 *
 * @param metadata - Metadata container to read from and write to.
 * @param metadataKey - Metadata key whose value should be parsed as JSON.
 */
export function unpackJSONStringMetadata(metadata: Metadata, metadataKey: string): void {
  const stringifiedMetadata = getMetadataValue(metadata, metadataKey);
  const json = stringifiedMetadata && parseJSONStringMetadata(stringifiedMetadata);

  for (const [key, value] of Object.entries(json || {})) {
    setMetadataValue(
      metadata,
      `${metadataKey}.${key}`,
      typeof value === 'string' ? value : JSON.stringify(value)
    );
  }
}

/**
 * Parses one JSON metadata value into an object.
 *
 * @param stringifiedMetadata - JSON metadata value.
 * @returns Parsed object or `null` when invalid.
 */
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
