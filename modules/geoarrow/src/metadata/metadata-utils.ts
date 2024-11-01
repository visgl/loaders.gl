// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * A type that matches a string-to-string metadata map
 * in the form of a map or an object.
 */
export type Metadata = Map<string, string> | Record<string, string>;

/**
 * A type that matches a variety of Apache arrow like schemas.
 *
 */
export type SchemaWithMetadata = {
  /** Schema level metadata */
  metadata?: Metadata;
  /** Field top-level metadata */
  fields?: {name: string; metadata?: Metadata}[];
};

export function getMetadataValue(metadata: Metadata, key: string): string | null {
  return metadata instanceof Map ? metadata.get(key) || null : metadata[key] || null;
}

export function setMetadataValue(metadata: Metadata, key: string, value: string): void {
  if (metadata instanceof Map) {
    metadata.set('key', key);
  } else {
    metadata.key = key;
  }
}
