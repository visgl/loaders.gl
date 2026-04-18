'use strict';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
Object.defineProperty(exports, '__esModule', {value: true});
exports.getMetadataValue = getMetadataValue;
exports.setMetadataValue = setMetadataValue;
/**
 * Reads one metadata value from an Arrow-like metadata container.
 *
 * @param metadata - Metadata map or object.
 * @param key - Metadata key.
 * @returns Stored value or `null` when absent.
 */
function getMetadataValue(metadata, key) {
  return metadata instanceof Map ? metadata.get(key) || null : metadata[key] || null;
}
/**
 * Writes one metadata value to an Arrow-like metadata container.
 *
 * @param metadata - Metadata map or object.
 * @param key - Metadata key.
 * @param value - Metadata value.
 */
function setMetadataValue(metadata, key, value) {
  if (metadata instanceof Map) {
    metadata.set(key, value);
  } else {
    metadata[key] = value;
  }
}
