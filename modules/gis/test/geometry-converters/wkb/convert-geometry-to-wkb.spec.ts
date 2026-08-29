// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';
import {convertGeometryToWKB, convertGeometryToWKT, convertWKTToGeometry} from '@loaders.gl/gis';
const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_2D_NAN_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d-nan.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';
const WKB_Z_NAN_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ-nan.json';
test('convertGeometryToWKB#2D', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());
  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = convertGeometryToWKB(geoJSON);
    expect(encoded, title).toEqual(wkb);
  }
});
test('convertGeometryToWKB#2D NaN', async () => {
  const response = await fetchFile(WKB_2D_NAN_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());
  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = convertGeometryToWKB(geoJSON);
    expect(encoded, title).toEqual(wkb);
  }
});
test('convertGeometryToWKB#Z', async () => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());
  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    // TODO - remove and fix empty handling
    if (title.startsWith('empty') || title.includes('One')) {
      continue;
    }
    const encoded = convertGeometryToWKB(geoJSON, {wkb: {hasZ: true, hasM: false}});
    expect(encoded, title).toEqual(wkb);
  }
});
test('convertGeometryToWKB#Z NaN', async () => {
  const response = await fetchFile(WKB_Z_NAN_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());
  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    // TODO - remove and fix empty handling
    if (title.startsWith('empty') || title.includes('One')) {
      continue;
    }
    const encoded = convertGeometryToWKB(geoJSON, {wkb: {hasZ: true, hasM: false}});
    expect(encoded, title).toEqual(wkb);
  }
});

test('convertGeometryToWKB#M writes the third coordinate as the measure', () => {
  const encoded = convertGeometryToWKB(
    {type: 'Point', coordinates: [12.5, -4.25, 300]},
    {hasM: true}
  );
  const dataView = new DataView(encoded);
  expect(dataView.getUint32(1, true)).toBe(2001);
  expect(dataView.getFloat64(5, true)).toBe(12.5);
  expect(dataView.getFloat64(13, true)).toBe(-4.25);
  expect(dataView.getFloat64(21, true)).toBe(300);
});

test('convertGeometryToWKB preserves child dimensions in GeometryCollections', () => {
  const collection = convertWKTToGeometry('GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT M (4 5 6))');
  expect(collection).toBeTruthy();

  const dataView = new DataView(convertGeometryToWKB(collection!));
  expect(dataView.getUint32(1, true)).toBe(7);
  expect(dataView.getUint32(10, true)).toBe(1001);
  expect(dataView.getUint32(39, true)).toBe(2001);
});

test('convertGeometryToWKT preserves mixed child dimensions in GeometryCollections', () => {
  const collection = convertWKTToGeometry('GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT M (4 5 6))');
  expect(collection).toBeTruthy();
  expect(convertGeometryToWKT(collection!)).toBe(
    'GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT M (4 5 6))'
  );
});

test('convertGeometryToWKT enforces an explicit coordinate dimension', () => {
  expect(convertGeometryToWKT({type: 'Point', coordinates: [1, 2, 3, 4]}, {dimension: 'xy'})).toBe(
    'POINT (1 2)'
  );
  expect(convertGeometryToWKT({type: 'Point', coordinates: [1, 2]}, {dimension: 'xyzm'})).toBe(
    'POINT ZM (1 2 0 0)'
  );
});

test.each([
  ['Point', {type: 'Point', coordinates: []}, 'POINT EMPTY'],
  ['LineString', {type: 'LineString', coordinates: []}, 'LINESTRING Z EMPTY'],
  ['Polygon', {type: 'Polygon', coordinates: []}, 'POLYGON EMPTY'],
  ['MultiPoint', {type: 'MultiPoint', coordinates: []}, 'MULTIPOINT EMPTY'],
  ['MultiLineString', {type: 'MultiLineString', coordinates: []}, 'MULTILINESTRING EMPTY'],
  ['MultiPolygon', {type: 'MultiPolygon', coordinates: []}, 'MULTIPOLYGON EMPTY'],
  ['GeometryCollection', {type: 'GeometryCollection', geometries: []}, 'GEOMETRYCOLLECTION EMPTY']
] as const)('convertGeometryToWKT and convertWKTToGeometry preserve empty %s', (_name, geometry, wkt) => {
  const options = geometry.type === 'LineString' ? {dimension: 'xyz' as const} : undefined;
  expect(convertGeometryToWKT(geometry as any, options)).toBe(wkt);
  expect(convertWKTToGeometry(wkt)).toEqual(geometry);
});

test.each([
  'POINT (1 2) trailing',
  'POINT Z (1 2)',
  'POINT M (1 2 3 4)',
  'LINESTRING (0 0, 1 1 2)'
])('convertWKTToGeometry rejects malformed WKT: %s', wkt => {
  expect(convertWKTToGeometry(wkt)).toBeNull();
});
