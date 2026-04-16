// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {fetchFile, load} from '@loaders.gl/core';
import {getGeoMetadata} from '@loaders.gl/geoarrow';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {KMLArrowLoader, KMLLoader} from '@loaders.gl/kml';
import type {ArrowTable, Feature, Geometry} from '@loaders.gl/schema';

const KML_URL = '@loaders.gl/kml/test/data/kml/KML_Samples.kml';
const KML_LINESTRING_URL = '@loaders.gl/kml/test/data/kml/linestring';

test('KMLArrowLoader#loader conformance', t => {
  validateLoader(t, KMLArrowLoader, 'KMLArrowLoader');
  t.end();
});

test('KMLArrowLoader#load sample infers mixed geometry metadata', async t => {
  const arrowTable = await load(KML_URL, KMLArrowLoader);
  const geoMetadata = getGeoMetadata(arrowTable.schema?.metadata || {});
  const expectedFeatures = await loadKMLFeatures(KML_URL);

  t.equal(arrowTable.shape, 'arrow-table', 'shape is arrow-table');
  t.equal(
    arrowTable.data.numRows,
    expectedFeatures.length,
    'Arrow row count matches KML feature count'
  );
  t.equal(geoMetadata?.primary_column, 'geometry', 'geo metadata primary column is set');
  t.equal(geoMetadata?.columns.geometry.encoding, 'wkb', 'geo metadata uses WKB encoding');
  t.deepEqual(
    geoMetadata?.columns.geometry.geometry_types,
    inferExpectedGeometryTypes(expectedFeatures),
    'geo metadata geometry types match mixed KML feature types'
  );
  t.end();
});

test('KMLArrowLoader#load fixture matches expected GeoJSON', async t => {
  const arrowTable = await load(`${KML_LINESTRING_URL}.kml`, KMLArrowLoader);
  const roundTripped = convertWKBTableToGeoJSON(
    {shape: 'object-row-table', schema: arrowTable.schema, data: getRowsFromArrowTable(arrowTable)},
    arrowTable.schema!
  );

  const response = await fetchFile(`${KML_LINESTRING_URL}.geojson`);
  const expected = await response.json();

  t.deepEqual(
    roundTripped.features,
    expected.features,
    'Arrow linestring matches expected GeoJSON'
  );
  t.end();
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
