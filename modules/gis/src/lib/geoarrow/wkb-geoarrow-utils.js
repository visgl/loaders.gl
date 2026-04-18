'use strict';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', {value: true});
exports.makeWKBGeometryField = makeWKBGeometryField;
exports.setWKBGeometryColumnMetadata = setWKBGeometryColumnMetadata;
exports.setWKBGeometrySchemaMetadata = setWKBGeometrySchemaMetadata;
exports.encodeWKBGeometryValue = encodeWKBGeometryValue;
exports.getGeometryWKBOptions = getGeometryWKBOptions;
exports.inferGeoParquetGeometryTypes = inferGeoParquetGeometryTypes;
exports.getCoordinateDimensions = getCoordinateDimensions;
exports.getGeometrySampleCoordinates = getGeometrySampleCoordinates;
var convert_geometry_to_wkb_1 = require('../geometry-converters/wkb/convert-geometry-to-wkb');
var geoparquet_metadata_1 = require('./geoparquet-metadata');
var DEFAULT_GEO_METADATA_VERSION = '1.1.0';
/**
 * Creates a nullable binary Arrow field for a WKB geometry column.
 *
 * @param geometryColumnName - Geometry column name.
 * @param nullable - Whether the field is nullable.
 * @returns Arrow field definition.
 */
function makeWKBGeometryField(geometryColumnName, nullable) {
  if (geometryColumnName === void 0) {
    geometryColumnName = 'geometry';
  }
  if (nullable === void 0) {
    nullable = true;
  }
  return {
    name: geometryColumnName,
    type: 'binary',
    nullable: nullable,
    metadata: {
      'ARROW:extension:name': 'geoarrow.wkb'
    }
  };
}
/**
 * Updates schema-level GeoParquet metadata for one WKB geometry column.
 *
 * @param metadata - Schema metadata container.
 * @param options - WKB geometry column options.
 */
function setWKBGeometryColumnMetadata(metadata, options) {
  if (options === void 0) {
    options = {};
  }
  var geometryColumnName = options.geometryColumnName || 'geometry';
  var primaryColumnName = options.primaryColumnName || geometryColumnName;
  var geometryTypes = options.geometryTypes || [];
  var nextGeoMetadata = (0, geoparquet_metadata_1.getGeoMetadata)(metadata) || {columns: {}};
  nextGeoMetadata.version =
    options.version || nextGeoMetadata.version || DEFAULT_GEO_METADATA_VERSION;
  nextGeoMetadata.primary_column = primaryColumnName;
  nextGeoMetadata.columns || (nextGeoMetadata.columns = {});
  nextGeoMetadata.columns[geometryColumnName] = __assign(
    __assign(__assign({}, nextGeoMetadata.columns[geometryColumnName]), options.columnMetadata),
    {encoding: 'wkb', geometry_types: geometryTypes}
  );
  (0, geoparquet_metadata_1.setGeoMetadata)(metadata, nextGeoMetadata);
}
/**
 * Updates one schema with WKB geometry column metadata.
 *
 * @param schema - Schema to update.
 * @param options - WKB geometry column options.
 * @returns The same schema reference for chaining.
 */
function setWKBGeometrySchemaMetadata(schema, options) {
  if (options === void 0) {
    options = {};
  }
  schema.metadata || (schema.metadata = {});
  setWKBGeometryColumnMetadata(schema.metadata, options);
  return schema;
}
/**
 * Encodes one geometry value as WKB bytes or passes through existing WKB bytes.
 *
 * @param value - Geometry or WKB byte value.
 * @returns WKB bytes or `null`.
 */
function encodeWKBGeometryValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (isGeometry(value)) {
    return new Uint8Array(
      (0, convert_geometry_to_wkb_1.convertGeometryToWKB)(value, getGeometryWKBOptions(value))
    );
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value.slice(0));
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
    );
  }
  throw new Error('Expected a Geometry, ArrayBuffer, ArrayBufferView, or null for WKB encoding.');
}
/**
 * Infers WKB serialization flags from geometry dimensionality.
 *
 * @param geometry - Geometry to inspect.
 * @returns WKB dimensional flags.
 */
function getGeometryWKBOptions(geometry) {
  var dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(geometry));
  return {
    hasZ: dimensions > 2,
    hasM: dimensions > 3
  };
}
/**
 * Infers GeoParquet geometry type strings from a sequence of geometries.
 *
 * @param geometries - Geometries to inspect.
 * @returns Unique geometry type strings in encounter order.
 */
function inferGeoParquetGeometryTypes(geometries) {
  var geometryTypes = new Set();
  for (var _i = 0, geometries_1 = geometries; _i < geometries_1.length; _i++) {
    var geometry = geometries_1[_i];
    if (!geometry) {
      continue;
    }
    var dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(geometry));
    geometryTypes.add(dimensions > 2 ? ''.concat(geometry.type, ' Z') : geometry.type);
  }
  return __spreadArray([], geometryTypes, true);
}
/**
 * Returns the coordinate dimensionality of one representative coordinate tuple.
 *
 * @param coordinates - Nested coordinate payload.
 * @returns Coordinate tuple length, defaulting to `2`.
 */
function getCoordinateDimensions(coordinates) {
  if (!Array.isArray(coordinates)) {
    return 2;
  }
  if (typeof coordinates[0] === 'number') {
    return coordinates.length;
  }
  if (coordinates.length === 0) {
    return 2;
  }
  return getCoordinateDimensions(coordinates[0]);
}
/**
 * Extracts one representative coordinate payload from a geometry.
 *
 * @param geometry - Geometry to inspect.
 * @returns Representative coordinate payload or `undefined`.
 */
function getGeometrySampleCoordinates(geometry) {
  if ('coordinates' in geometry) {
    return geometry.coordinates;
  }
  if ('geometries' in geometry && geometry.geometries.length > 0) {
    return getGeometrySampleCoordinates(geometry.geometries[0]);
  }
  return undefined;
}
function isGeometry(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'type' in value && ('coordinates' in value || 'geometries' in value);
}
