// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Metadata container compatible with Apache Arrow metadata maps and plain objects.
 */
export type Metadata = Map<string, string> | Record<string, string>;

/**
 * Arrow-like schema shape that exposes schema and field metadata.
 */
export type SchemaWithMetadata = {
  /** Schema-level metadata. */
  metadata?: Metadata;
  /** Top-level fields with optional metadata. */
  fields?: {name: string; metadata?: Metadata}[];
};

/**
 * Reads one metadata value from an Arrow-like metadata container.
 *
 * @param metadata - Metadata map or object.
 * @param key - Metadata key.
 * @returns Stored value or `null` when absent.
 */
export function getMetadataValue(metadata: Metadata, key: string): string | null {
  return metadata instanceof Map ? metadata.get(key) || null : metadata[key] || null;
}

/**
 * Writes one metadata value to an Arrow-like metadata container.
 *
 * @param metadata - Metadata map or object.
 * @param key - Metadata key.
 * @param value - Metadata value.
 */
export function setMetadataValue(metadata: Metadata, key: string, value: string): void {
  if (metadata instanceof Map) {
    metadata.set(key, value);
  } else {
    metadata[key] = value;
  }
}
