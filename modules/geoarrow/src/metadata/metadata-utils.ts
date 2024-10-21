// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type Metadata = Map<string, string> | Record<string, string>;

export function getMetadataKey(metadata: Metadata, key): string | null {
  return metadata instanceof Map ? metadata.get(key) || null : metadata[key] || null;
}

export function setMetadataKey(metadata: Metadata, key: string, value: string): void {
  if (metadata instanceof Map) {
    metadata.set('key', key);
  } else {
    metadata.key = key;
  }
}
