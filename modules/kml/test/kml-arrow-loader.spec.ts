// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {fetchFile, load} from '@loaders.gl/core';
import {getGeoMetadata} from '@loaders.gl/schema';
import {convertGeoArrowTableToGeoJSON} from '@loaders.gl/arrow-geometry/geojson-table';
import {KMLLoader} from '@loaders.gl/kml';
import * as kml from '@loaders.gl/kml';
import * as bundledKml from '@loaders.gl/kml/bundled';
import * as unbundledKml from '@loaders.gl/kml/unbundled';
import type {Feature, Geometry} from '@loaders.gl/schema';
const KML_URL = '@loaders.gl/kml/test/data/kml/KML_Samples.kml';
const KML_LINESTRING_URL = '@loaders.gl/kml/test/data/kml/linestring';
test('KMLLoader#loader conformance', () => {
  validateLoader(KMLLoader, 'KMLLoader');
});
test('KMLLoader#removed Arrow loader exports', () => {
  expect('KMLArrowLoader' in kml, 'root does not export KMLArrowLoader').toBeFalsy();
  expect('KMLArrowLoader' in bundledKml, 'bundled does not export KMLArrowLoader').toBeFalsy();
  expect('KMLArrowLoader' in unbundledKml, 'unbundled does not export KMLArrowLoader').toBeFalsy();
});
test('KMLLoader#load sample infers mixed geometry metadata with shape: arrow-table', async () => {
  const arrowTable = await load(KML_URL, KMLLoader, {kml: {shape: 'arrow-table'}});
  const geoMetadata = getGeoMetadata(arrowTable.schema?.metadata || {});
  const expectedFeatures = await loadKMLFeatures(KML_URL);
  expect(arrowTable.shape, 'shape is arrow-table').toBe('arrow-table');
  expect(arrowTable.data.numRows, 'Arrow row count matches KML feature count').toBe(
    expectedFeatures.length
  );
  expect(geoMetadata?.primary_column, 'geo metadata primary column is set').toBe('geometry');
  expect(geoMetadata?.columns.geometry.encoding, 'geo metadata uses WKB encoding').toBe('wkb');
  expect(
    geoMetadata?.columns.geometry.geometry_types,
    'geo metadata geometry types match mixed KML feature types'
  ).toEqual(inferExpectedGeometryTypes(expectedFeatures));
});
test('KMLLoader#load fixture matches expected GeoJSON with shape: arrow-table', async () => {
  const arrowTable = await load(`${KML_LINESTRING_URL}.kml`, KMLLoader, {
    kml: {shape: 'arrow-table'}
  });
  const roundTripped = convertGeoArrowTableToGeoJSON(arrowTable.data, arrowTable.schema!);
  const response = await fetchFile(`${KML_LINESTRING_URL}.geojson`);
  const expected = await response.json();
  expect(roundTripped.features, 'Arrow linestring matches expected GeoJSON').toEqual(
    expected.features
  );
});
/**
 * Loads KML features through the classic KML loader for comparison.
 *
 * @param url - Fixture URL.
 * @returns Parsed GeoJSON features.
 */
async function loadKMLFeatures(url: string): Promise<Feature[]> {
  const table = await load(url, KMLLoader, {kml: {shape: 'geojson-table'}});
  return table.shape === 'geojson-table' ? table.features : [];
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
