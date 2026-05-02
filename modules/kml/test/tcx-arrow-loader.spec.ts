// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {load} from '@loaders.gl/core';
import {getGeoMetadata} from '@loaders.gl/geoarrow';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {TCXLoader} from '@loaders.gl/kml';
import * as kml from '@loaders.gl/kml';
import * as bundledKml from '@loaders.gl/kml/bundled';
import * as unbundledKml from '@loaders.gl/kml/unbundled';
import type {ArrowTable, Feature, Geometry} from '@loaders.gl/schema';

const TCX_URL = '@loaders.gl/kml/test/data/tcx/tcx_sample.tcx';

test('TCXLoader#loader conformance', t => {
  validateLoader(t, TCXLoader, 'TCXLoader');
  t.end();
});

test('TCXLoader#removed Arrow loader exports', t => {
  t.notOk('TCXArrowLoader' in kml, 'root does not export TCXArrowLoader');
  t.notOk('TCXArrowLoader' in bundledKml, 'bundled does not export TCXArrowLoader');
  t.notOk('TCXArrowLoader' in unbundledKml, 'unbundled does not export TCXArrowLoader');
  t.end();
});

test('TCXLoader#parse with shape: arrow-table', async t => {
  const arrowTable = await load(TCX_URL, TCXLoader, {tcx: {shape: 'arrow-table'}});
  const geoMetadata = getGeoMetadata(arrowTable.schema?.metadata || {});
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: getRowsFromArrowTable(arrowTable)},
    arrowTable.schema!
  );
  const expectedTable = await load(TCX_URL, TCXLoader, {tcx: {shape: 'geojson-table'}});
  const expectedFeatures =
    expectedTable.shape === 'geojson-table'
      ? normalizeComplexProperties(expectedTable.features)
      : [];

  t.equal(arrowTable.shape, 'arrow-table', 'shape is arrow-table');
  t.equal(geoMetadata?.primary_column, 'geometry', 'geo metadata primary column is set');
  t.equal(geoMetadata?.columns.geometry.encoding, 'wkb', 'geo metadata uses WKB encoding');
  t.deepEqual(
    geoMetadata?.columns.geometry.geometry_types,
    inferExpectedGeometryTypes(expectedFeatures),
    'geo metadata geometry type matches TCX output'
  );
  t.deepEqual(roundTripped.features, expectedFeatures, 'Arrow output matches TCXLoader output');
  t.end();
});

/**
 * Reads Arrow rows as plain objects so they can be passed to WKB conversion helpers.
 *
 * @param table - Arrow table emitted by a loader.
 * @returns Object rows preserving the binary geometry column.
 */
function getRowsFromArrowTable(table: ArrowTable): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    const row = table.data.get(rowIndex)?.toJSON() || {};
    rows.push(normalizeBinaryGeometryRow(row));
  }
  return rows;
}

/**
 * Infers expected GeoParquet geometry type strings from classic GeoJSON features.
 *
 * @param features - Features to inspect.
 * @returns Unique geometry types in encounter order.
 */
function inferExpectedGeometryTypes(features: Feature[]): string[] {
  const geometryTypes = new Set<string>();
  for (const feature of features) {
    if (!feature.geometry) {
      continue;
    }
    const dimensions = getCoordinateDimensions(getGeometrySampleCoordinates(feature.geometry));
    geometryTypes.add(dimensions > 2 ? `${feature.geometry.type} Z` : feature.geometry.type);
  }
  return [...geometryTypes];
}

/**
 * Returns the coordinate dimensionality of one representative geometry coordinate tuple.
 *
 * @param coordinates - Nested coordinate payload.
 * @returns Coordinate tuple length, defaulting to `2`.
 */
function getCoordinateDimensions(coordinates: unknown): number {
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
 * @param geometry - Geometry to sample.
 * @returns Representative coordinates or `undefined` when empty.
 */
function getGeometrySampleCoordinates(geometry: Geometry): unknown {
  if ('coordinates' in geometry) {
    return geometry.coordinates;
  }
  if ('geometries' in geometry && geometry.geometries.length > 0) {
    return getGeometrySampleCoordinates(geometry.geometries[0]);
  }
  return undefined;
}

/**
 * Normalizes classic GeoJSON feature properties to the Arrow-safe representation used by the loader.
 *
 * @param features - Features from `TCXLoader`.
 * @returns Features with complex properties stringified.
 */
function normalizeComplexProperties(features: Feature[]): Feature[] {
  return features.map(feature => ({
    ...feature,
    properties: normalizePropertiesObject(feature.properties || {})
  }));
}

/**
 * Converts nested property values to strings so expected data matches Arrow column preservation.
 *
 * @param properties - Feature properties to normalize.
 * @returns Normalized properties object.
 */
function normalizePropertiesObject(properties: Record<string, unknown>): Record<string, unknown> {
  const normalizedProperties: Record<string, unknown> = {};
  for (const [propertyName, propertyValue] of Object.entries(properties)) {
    normalizedProperties[propertyName] = normalizePropertyValue(propertyValue);
  }
  return normalizedProperties;
}

/**
 * Converts nested property values to Arrow-safe scalar values.
 *
 * @param propertyValue - Property value to normalize.
 * @returns Scalar value preserved by the Arrow loader.
 */
function normalizePropertyValue(propertyValue: unknown): unknown {
  if (
    propertyValue === null ||
    propertyValue === undefined ||
    typeof propertyValue === 'string' ||
    typeof propertyValue === 'number' ||
    typeof propertyValue === 'boolean'
  ) {
    return propertyValue ?? null;
  }
  return JSON.stringify(propertyValue);
}

/**
 * Ensures the geometry column is represented as a typed byte array for WKB conversion helpers.
 *
 * @param row - Serialized Arrow row.
 * @returns Row with a normalized `geometry` value.
 */
function normalizeBinaryGeometryRow(row: Record<string, unknown>): Record<string, unknown> {
  const geometry = row.geometry;
  if (Array.isArray(geometry) || isNumericKeyObject(geometry)) {
    return {...row, geometry: new Uint8Array(Object.values(geometry as Record<string, number>))};
  }
  return row;
}

/**
 * Returns true when a value is a plain object containing numeric keys for byte values.
 *
 * @param value - Candidate geometry value.
 * @returns Whether the value should be converted to `Uint8Array`.
 */
function isNumericKeyObject(value: unknown): value is Record<string, number> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !ArrayBuffer.isView(value) &&
    Object.keys(value).every(key => /^\d+$/.test(key))
  );
}
