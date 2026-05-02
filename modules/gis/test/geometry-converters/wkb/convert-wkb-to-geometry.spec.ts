// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {Test} from 'tape';
import {fetchFile} from '@loaders.gl/core';
import {earcut} from '@math.gl/polygon';
import {
  convertGeometryToWKB,
  convertWKBToBinaryGeometry,
  convertWKBToGeometry,
  isWKB,
  triangulateWKB
} from '@loaders.gl/gis';
import type {Geometry, Position} from '@loaders.gl/schema';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';

function normalizeTypedArrays(value: unknown): unknown {
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    return Array.from(value as ArrayLike<number>);
  }

  if (Array.isArray(value)) {
    return value.map(entry => normalizeTypedArrays(entry));
  }

  if (value && typeof value === 'object') {
    const normalizedEntries = Object.entries(value).map(([key, entry]) => [
      key,
      normalizeTypedArrays(entry)
    ]);
    return Object.fromEntries(normalizedEntries);
  }

  return value;
}

test('convertWKBToBinaryGeometry#2D', async t => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  const TEST_CASES2 = {multiPolygonWithTwoPolygons: TEST_CASES.multiPolygonWithTwoPolygons};
  for (const [title, testCase] of Object.entries(TEST_CASES2)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      t.ok(isWKB(testCase.wkb), 'isWKB(2D)');
      const result = convertWKBToBinaryGeometry(testCase.wkb);
      t.deepEqual(normalizeTypedArrays(result), normalizeTypedArrays(testCase.binary), title);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      t.ok(isWKB(testCase.wkbXdr), 'isWKB(2D)');
      const result = convertWKBToBinaryGeometry(testCase.wkbXdr);
      t.deepEqual(normalizeTypedArrays(result), normalizeTypedArrays(testCase.binary), title);
    }
  }

  t.end();
});

test('convertWKBToBinaryGeometry#Z', async t => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      t.ok(isWKB(testCase.wkb), 'isWKB(Z)');
      const result = convertWKBToBinaryGeometry(testCase.wkb);
      t.deepEqual(normalizeTypedArrays(result), normalizeTypedArrays(testCase.binary), title);
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      t.ok(isWKB(testCase.wkbXdr), 'isWKB(Z)');
      const result = convertWKBToBinaryGeometry(testCase.wkbXdr);
      t.deepEqual(normalizeTypedArrays(result), normalizeTypedArrays(testCase.binary), title);
    }

    // if (testCase.wkbXdr && testCase.binary && testCase.geoJSON) {
    //   t.deepEqual(parseSync(testCase.wkbXdr, WKBLoader, {wkb: {shape: 'geometry'}}), testCase.geoJSON);
    // }
  }

  t.end();
});

test('convertWKBToGeometry#GeometryCollection 2D', async t => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(testCases)) {
    if (testCase.geoJSON?.type !== 'GeometryCollection') {
      continue;
    }

    if (testCase.wkb) {
      t.ok(isWKB(testCase.wkb), 'isWKB(GeometryCollection 2D)');
      t.deepEqual(convertWKBToGeometry(testCase.wkb), testCase.geoJSON, `${title} little endian`);
    }

    if (testCase.wkbXdr) {
      t.ok(isWKB(testCase.wkbXdr), 'isWKB(GeometryCollection 2D XDR)');
      t.deepEqual(convertWKBToGeometry(testCase.wkbXdr), testCase.geoJSON, `${title} big endian`);
    }
  }

  t.end();
});

test('convertWKBToGeometry#GeometryCollection Z', async t => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(testCases)) {
    if (testCase.geoJSON?.type !== 'GeometryCollection') {
      continue;
    }

    if (testCase.wkb) {
      t.ok(isWKB(testCase.wkb), 'isWKB(GeometryCollection Z)');
      t.deepEqual(convertWKBToGeometry(testCase.wkb), testCase.geoJSON, `${title} little endian`);
    }

    if (testCase.wkbXdr) {
      t.ok(isWKB(testCase.wkbXdr), 'isWKB(GeometryCollection Z XDR)');
      t.deepEqual(convertWKBToGeometry(testCase.wkbXdr), testCase.geoJSON, `${title} big endian`);
    }
  }

  t.end();
});

test('triangulateWKB#2D matches GeoJSON earcut path', async t => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const title of ['polygon', 'polygonWithOneInteriorRing', 'multiPolygonWithTwoPolygons']) {
    const testCase = testCases[title];

    if (testCase.wkb) {
      assertTriangulateWKBMatchesEarcutInputs(t, testCase.wkb, `${title} little endian`);
    }

    if (testCase.wkbXdr) {
      assertTriangulateWKBMatchesEarcutInputs(t, testCase.wkbXdr, `${title} big endian`);
    }
  }

  t.end();
});

test('triangulateWKB#Z uses XY coordinates', async t => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const title of ['polygon', 'multiPolygonWithTwoPolygons']) {
    const testCase = testCases[title];

    if (testCase.wkb) {
      assertTriangulateWKBMatchesEarcutInputs(t, testCase.wkb, `${title} Z little endian`);
    }

    if (testCase.wkbXdr) {
      assertTriangulateWKBMatchesEarcutInputs(t, testCase.wkbXdr, `${title} Z big endian`);
    }
  }

  t.end();
});

test('triangulateWKB#M and ZM use XY coordinates', t => {
  const polygon = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [0, 0, 10, 100],
        [1, 0, 20, 200],
        [1, 1, 30, 300],
        [0, 1, 40, 400],
        [0, 0, 10, 100]
      ]
    ]
  };

  assertTriangulateWKBMatchesEarcutInputs(
    t,
    convertGeometryToWKB(polygon, {hasM: true}),
    'polygon M'
  );
  assertTriangulateWKBMatchesEarcutInputs(
    t,
    convertGeometryToWKB(polygon, {hasZ: true, hasM: true}),
    'polygon ZM'
  );

  t.end();
});

test('triangulateWKB#rejects non-polygon geometry', async t => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  t.throws(
    () => triangulateWKB(testCases.lineString.wkb),
    /Expected Polygon or MultiPolygon/,
    'rejects LineString WKB'
  );

  t.end();
});

/**
 * Verifies direct WKB triangulation against the existing GeoJSON-to-earcut path.
 * @param t Tape assertion context.
 * @param wkb WKB input.
 * @param title Assertion title.
 */
function assertTriangulateWKBMatchesEarcutInputs(t: Test, wkb: ArrayBuffer, title: string): void {
  const inputs = getGeometryEarcutInputs(convertWKBToGeometry(wkb));
  const expectedTriangles = inputs.flatMap(input =>
    earcut(input.positions, input.holeIndices, input.dimensions).map(
      triangleIndex => triangleIndex + input.vertexOffset
    )
  );
  const triangles = triangulateWKB(wkb);

  t.deepEqual(triangles, expectedTriangles, `${title} triangles match GeoJSON earcut`);
}

/**
 * Converts GeoJSON Polygon or MultiPolygon geometry to standard earcut inputs.
 * @param geometry GeoJSON polygon geometry.
 * @returns One earcut input per polygon.
 */
function getGeometryEarcutInputs(geometry: Geometry): {
  positions: number[];
  holeIndices?: number[];
  dimensions: number;
  vertexOffset: number;
}[] {
  switch (geometry.type) {
    case 'Polygon':
      return [getPolygonEarcutInput(geometry.coordinates, 0)];
    case 'MultiPolygon': {
      const inputs: {
        positions: number[];
        holeIndices?: number[];
        dimensions: number;
        vertexOffset: number;
      }[] = [];
      let vertexOffset = 0;

      for (const polygon of geometry.coordinates) {
        inputs.push(getPolygonEarcutInput(polygon, vertexOffset));
        vertexOffset += polygon.reduce((count, ring) => count + ring.length, 0);
      }
      return inputs;
    }
    default:
      throw new Error(`Expected Polygon or MultiPolygon geometry, found ${geometry.type}.`);
  }
}

/**
 * Converts one GeoJSON polygon coordinate array to a standard earcut input.
 * @param polygonCoordinates GeoJSON polygon coordinates.
 * @param vertexOffset First polygon vertex index in the source WKB geometry.
 * @returns Standard earcut input.
 */
function getPolygonEarcutInput(
  polygonCoordinates: Position[][],
  vertexOffset: number
): {
  positions: number[];
  holeIndices?: number[];
  dimensions: number;
  vertexOffset: number;
} {
  const positions: number[] = [];
  const holeIndices: number[] = [];

  for (let ringIndex = 0; ringIndex < polygonCoordinates.length; ringIndex++) {
    const ring = polygonCoordinates[ringIndex];
    if (ringIndex > 0) {
      holeIndices.push(positions.length / 2);
    }
    for (const position of ring) {
      positions.push(position[0], position[1]);
    }
  }

  return {
    positions,
    holeIndices: holeIndices.length ? holeIndices : undefined,
    dimensions: 2,
    vertexOffset
  };
}
