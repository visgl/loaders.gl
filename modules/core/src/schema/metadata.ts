// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoMetadata} from './geometry/geoarrow';

/** Metadata container compatible with Apache Arrow metadata maps and plain objects. */
export type Metadata = Map<string, string> | Record<string, string>;

/** Arrow-like schema shape that exposes schema and field metadata. */
export type SchemaWithMetadata = {
  /** Schema-level metadata. */
  metadata?: Metadata;
  /** Top-level fields with optional metadata. */
  fields?: {name: string; metadata?: Metadata}[];
};

/**
 * Reads one metadata value from an Arrow-like metadata container.
 *
 * @param metadata Metadata map or object.
 * @param key Metadata key.
 * @returns Stored value or `null` when absent.
 */
export function getMetadataValue(metadata: Metadata, key: string): string | null {
  return metadata instanceof Map ? metadata.get(key) || null : metadata[key] || null;
}

/**
 * Writes one metadata value to an Arrow-like metadata container.
 *
 * @param metadata Metadata map or object.
 * @param key Metadata key.
 * @param value Metadata value.
 */
export function setMetadataValue(metadata: Metadata, key: string, value: string): void {
  if (metadata instanceof Map) {
    metadata.set(key, value);
  } else {
    metadata[key] = value;
  }
}

/** Reads GeoParquet metadata from a schema metadata container. */
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
    if (column && typeof column === 'object' && typeof column.encoding === 'string') {
      column.encoding = column.encoding.toLowerCase();
    }
  }

  return geoMetadata as GeoMetadata;
}

/** Stores GeoParquet metadata under the top-level `geo` key. */
export function setGeoMetadata(metadata: Metadata, geoMetadata: GeoMetadata): void {
  setMetadataValue(metadata, 'geo', JSON.stringify(geoMetadata));
}

/** Unpacks top-level GeoParquet metadata into flattened metadata entries. */
export function unpackGeoMetadata(metadata: Metadata): void {
  const geoMetadata = getGeoMetadata(metadata);
  if (!geoMetadata) {
    return;
  }

  const {version, primary_column: primaryColumn, columns} = geoMetadata;
  if (version) {
    setMetadataValue(metadata, 'geo.version', version);
  }
  if (primaryColumn) {
    setMetadataValue(metadata, 'geo.primary_column', primaryColumn);
  }
  setMetadataValue(metadata, 'geo.columns', Object.keys(columns || {}).join(','));
}

/** Unpacks one JSON metadata value into flattened metadata entries. */
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

/** Parses one JSON metadata value into an object. */
export function parseJSONStringMetadata(
  stringifiedMetadata: string
): Record<string, unknown> | null {
  if (!stringifiedMetadata) {
    return null;
  }

  try {
    const metadata = JSON.parse(stringifiedMetadata);
    return metadata && typeof metadata === 'object' ? metadata : null;
  } catch {
    return null;
  }
}
