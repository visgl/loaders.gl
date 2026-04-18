'use strict';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
Object.defineProperty(exports, '__esModule', {value: true});
exports.getGeoMetadata = getGeoMetadata;
exports.setGeoMetadata = setGeoMetadata;
exports.unpackGeoMetadata = unpackGeoMetadata;
exports.unpackJSONStringMetadata = unpackJSONStringMetadata;
exports.parseJSONStringMetadata = parseJSONStringMetadata;
/* eslint-disable camelcase */
var metadata_utils_1 = require('./metadata-utils');
/**
 * Reads GeoParquet metadata from a metadata container.
 *
 * @param metadata - Schema metadata container.
 * @returns Parsed GeoParquet metadata or `null`.
 */
function getGeoMetadata(metadata) {
  if (!metadata) {
    return null;
  }
  var stringifiedGeoMetadata = (0, metadata_utils_1.getMetadataValue)(metadata, 'geo');
  var geoMetadata = stringifiedGeoMetadata && parseJSONStringMetadata(stringifiedGeoMetadata);
  if (!geoMetadata) {
    return null;
  }
  for (var _i = 0, _a = Object.values(geoMetadata.columns || {}); _i < _a.length; _i++) {
    var column = _a[_i];
    if (column.encoding) {
      column.encoding = column.encoding.toLowerCase();
    }
  }
  return geoMetadata;
}
/**
 * Stores GeoParquet metadata in the top-level `geo` schema metadata key.
 *
 * @param metadata - Schema metadata container.
 * @param geoMetadata - Metadata value to store.
 */
function setGeoMetadata(metadata, geoMetadata) {
  (0, metadata_utils_1.setMetadataValue)(metadata, 'geo', JSON.stringify(geoMetadata));
}
/**
 * Unpacks top-level GeoParquet metadata into flattened metadata entries.
 *
 * @param metadata - Schema metadata container.
 */
function unpackGeoMetadata(metadata) {
  var geoMetadata = getGeoMetadata(metadata);
  if (!geoMetadata) {
    return;
  }
  var version = geoMetadata.version,
    primary_column = geoMetadata.primary_column,
    columns = geoMetadata.columns;
  if (version) {
    (0, metadata_utils_1.setMetadataValue)(metadata, 'geo.version', version);
  }
  if (primary_column) {
    (0, metadata_utils_1.setMetadataValue)(metadata, 'geo.primary_column', primary_column);
  }
  (0, metadata_utils_1.setMetadataValue)(
    metadata,
    'geo.columns',
    Object.keys(columns || {}).join(',')
  );
}
/**
 * Unpacks one JSON-encoded metadata value into flattened metadata entries.
 *
 * @param metadata - Metadata container to read from and write to.
 * @param metadataKey - Metadata key whose value should be parsed as JSON.
 */
function unpackJSONStringMetadata(metadata, metadataKey) {
  var stringifiedMetadata = (0, metadata_utils_1.getMetadataValue)(metadata, metadataKey);
  var json = stringifiedMetadata && parseJSONStringMetadata(stringifiedMetadata);
  for (var _i = 0, _a = Object.entries(json || {}); _i < _a.length; _i++) {
    var _b = _a[_i],
      key = _b[0],
      value = _b[1];
    (0, metadata_utils_1.setMetadataValue)(
      metadata,
      ''.concat(metadataKey, '.').concat(key),
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
function parseJSONStringMetadata(stringifiedMetadata) {
  if (!stringifiedMetadata) {
    return null;
  }
  try {
    var metadata = JSON.parse(stringifiedMetadata);
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    return metadata;
  } catch (_a) {
    return null;
  }
}
