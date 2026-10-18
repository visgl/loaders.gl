// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import {readFile} from 'node:fs/promises';
import {expect, test} from 'vitest';
import {resolvePath} from '@loaders.gl/core';
import {
  GEOARROW_MULTILINE_FILE,
  GEOARROW_POINT_FILE,
  GEOARROW_POINT_WKB_FILE,
  GEOARROW_POLYGON_FILE
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';
import {
  convertGeoArrowTableToBinaryFeatureCollection,
  getApacheArrowTable,
  getGeoArrowGeometryColumn
} from '../src/geoarrow-table-adapter';
import {setupLoaderTestEnvironment} from '../../../test/vitest-setup-loaders';
await setupLoaderTestEnvironment();
/** Loads an Apache Arrow table from a GeoArrow fixture. */
async function loadArrowTable(filePath: string): Promise<arrow.Table> {
  const file = await readFile(resolvePath(filePath));
  return arrow.tableFromIPC(file);
}
test('GeoArrowTableAdapter#converts native point, line, and polygon tables', async () => {
  const pointTable = await loadArrowTable(GEOARROW_POINT_FILE);
  const lineTable = await loadArrowTable(GEOARROW_MULTILINE_FILE);
  const polygonTable = await loadArrowTable(GEOARROW_POLYGON_FILE);
  const pointData = convertGeoArrowTableToBinaryFeatureCollection(pointTable);
  const lineData = convertGeoArrowTableToBinaryFeatureCollection(lineTable);
  const polygonData = convertGeoArrowTableToBinaryFeatureCollection(polygonTable);
  expect(pointData.shape, 'point data is binary GeoJSON').toBe('binary-feature-collection');
  expect(pointData.points?.positions.value.length, 'point positions are populated').toBeTruthy();
  expect(
    pointData.lines && pointData.polygons,
    'point data includes empty deck.gl geometry bins'
  ).toBeTruthy();
  expect(lineData.shape, 'line data is binary GeoJSON').toBe('binary-feature-collection');
  expect(lineData.lines?.pathIndices.value.length, 'line path indices are populated').toBeTruthy();
  expect(
    lineData.points && lineData.polygons,
    'line data includes empty deck.gl geometry bins'
  ).toBeTruthy();
  expect(polygonData.shape, 'polygon data is binary GeoJSON').toBe('binary-feature-collection');
  expect(
    polygonData.polygons?.polygonIndices.value.length,
    'polygon indices are populated'
  ).toBeTruthy();
  expect(
    polygonData.points && polygonData.lines,
    'polygon data includes empty deck.gl geometry bins'
  ).toBeTruthy();
});
test('GeoArrowTableAdapter#converts WKB tables and loaders.gl table wrappers', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const binaryData = convertGeoArrowTableToBinaryFeatureCollection({
    shape: 'arrow-table',
    data: table
  });
  expect(binaryData.shape, 'wrapper data is binary GeoJSON').toBe('binary-feature-collection');
  expect(
    binaryData.points?.positions.value.length,
    'WKB point positions are populated'
  ).toBeTruthy();
  expect(
    binaryData.lines && binaryData.polygons,
    'WKB data includes empty deck.gl geometry bins'
  ).toBeTruthy();
  expect(getApacheArrowTable(table), 'raw Apache Arrow table is returned as-is').toBe(table);
  expect(
    getApacheArrowTable({shape: 'arrow-table', data: table}),
    'loaders.gl wrapper resolves to Apache Arrow table'
  ).toBe(table);
});
test('GeoArrowTableAdapter#validates geometry column metadata', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  const geometryColumn = getGeoArrowGeometryColumn(table, 'geometry');
  expect(geometryColumn.geometryColumn, 'resolves explicit geometry column').toBe('geometry');
  expect(geometryColumn.encoding, 'resolves point encoding').toBe('geoarrow.point');
  expect(
    () => getApacheArrowTable({shape: 'not-arrow-table'} as any),
    'rejects non-Arrow input'
  ).toThrow(/expected an Apache Arrow table/);
  expect(
    () => getGeoArrowGeometryColumn(table, 'missing'),
    'rejects missing geometry column metadata'
  ).toThrow(/could not find GeoArrow metadata/);
});
