// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {load} from '@loaders.gl/core';
import {getGeoMetadata} from '@loaders.gl/schema';
import {convertGeoArrowTableToGeoJSON} from '@loaders.gl/arrow-geometry/geojson-table';
import {TCXLoader} from '@loaders.gl/kml';
import * as kml from '@loaders.gl/kml';
import * as bundledKml from '@loaders.gl/kml/bundled';
import * as unbundledKml from '@loaders.gl/kml/unbundled';
import type {Feature, Geometry} from '@loaders.gl/schema';
const TCX_URL = '@loaders.gl/kml/test/data/tcx/tcx_sample.tcx';
test('TCXLoader#loader conformance', () => {
  validateLoader(TCXLoader, 'TCXLoader');
});
test('TCXLoader#removed Arrow loader exports', () => {
  expect('TCXArrowLoader' in kml, 'root does not export TCXArrowLoader').toBeFalsy();
  expect('TCXArrowLoader' in bundledKml, 'bundled does not export TCXArrowLoader').toBeFalsy();
  expect('TCXArrowLoader' in unbundledKml, 'unbundled does not export TCXArrowLoader').toBeFalsy();
});
test('TCXLoader#parse with shape: arrow-table', async () => {
  const arrowTable = await load(TCX_URL, TCXLoader, {tcx: {shape: 'arrow-table'}});
  const geoMetadata = getGeoMetadata(arrowTable.schema?.metadata || {});
  const roundTripped = convertGeoArrowTableToGeoJSON(arrowTable.data, arrowTable.schema!);
  const expectedTable = await load(TCX_URL, TCXLoader, {tcx: {shape: 'geojson-table'}});
  const expectedFeatures =
    expectedTable.shape === 'geojson-table'
      ? normalizeComplexProperties(expectedTable.features)
      : [];
  expect(arrowTable.shape, 'shape is arrow-table').toBe('arrow-table');
  expect(geoMetadata?.primary_column, 'geo metadata primary column is set').toBe('geometry');
  expect(geoMetadata?.columns.geometry.encoding, 'geo metadata uses WKB encoding').toBe('wkb');
  expect(
    geoMetadata?.columns.geometry.geometry_types,
    'geo metadata geometry type matches TCX output'
  ).toEqual(inferExpectedGeometryTypes(expectedFeatures));
  expect(roundTripped.features, 'Arrow output matches TCXLoader output').toEqual(expectedFeatures);
});
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
