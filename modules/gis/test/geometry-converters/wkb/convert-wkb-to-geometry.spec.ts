// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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

test('convertWKBToBinaryGeometry#2D', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  const TEST_CASES2 = {multiPolygonWithTwoPolygons: TEST_CASES.multiPolygonWithTwoPolygons};
  for (const [title, testCase] of Object.entries(TEST_CASES2)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      expect(isWKB(testCase.wkb)).toBe(true);
      const result = convertWKBToBinaryGeometry(testCase.wkb);
      expect(normalizeTypedArrays(result), title).toEqual(normalizeTypedArrays(testCase.binary));
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      expect(isWKB(testCase.wkbXdr)).toBe(true);
      const result = convertWKBToBinaryGeometry(testCase.wkbXdr);
      expect(normalizeTypedArrays(result), title).toEqual(normalizeTypedArrays(testCase.binary));
    }
  }
});

test('convertWKBToBinaryGeometry#Z', async () => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      expect(isWKB(testCase.wkb)).toBe(true);
      const result = convertWKBToBinaryGeometry(testCase.wkb);
      expect(normalizeTypedArrays(result), title).toEqual(normalizeTypedArrays(testCase.binary));
    }

    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      expect(isWKB(testCase.wkbXdr)).toBe(true);
      const result = convertWKBToBinaryGeometry(testCase.wkbXdr);
      expect(normalizeTypedArrays(result), title).toEqual(normalizeTypedArrays(testCase.binary));
    }

    // if (testCase.wkbXdr && testCase.binary && testCase.geoJSON) {
    //   t.deepEqual(parseSync(testCase.wkbXdr, WKBLoader, {wkb: {shape: 'geometry'}}), testCase.geoJSON);
    // }
  }
});

test('convertWKBToGeometry#GeometryCollection 2D', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(testCases)) {
    if (testCase.geoJSON?.type !== 'GeometryCollection') {
      continue;
    }

    if (testCase.wkb) {
      expect(isWKB(testCase.wkb)).toBe(true);
      expect(convertWKBToGeometry(testCase.wkb), `${title} little endian`).toEqual(
        testCase.geoJSON
      );
    }

    if (testCase.wkbXdr) {
      expect(isWKB(testCase.wkbXdr)).toBe(true);
      expect(convertWKBToGeometry(testCase.wkbXdr), `${title} big endian`).toEqual(
        testCase.geoJSON
      );
    }
  }
});

test('convertWKBToGeometry#GeometryCollection Z', async () => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const [title, testCase] of Object.entries(testCases)) {
    if (testCase.geoJSON?.type !== 'GeometryCollection') {
      continue;
    }

    if (testCase.wkb) {
      expect(isWKB(testCase.wkb)).toBe(true);
      expect(convertWKBToGeometry(testCase.wkb), `${title} little endian`).toEqual(
        testCase.geoJSON
      );
    }

    if (testCase.wkbXdr) {
      expect(isWKB(testCase.wkbXdr)).toBe(true);
      expect(convertWKBToGeometry(testCase.wkbXdr), `${title} big endian`).toEqual(
        testCase.geoJSON
      );
    }
  }
});

test('triangulateWKB#2D matches GeoJSON earcut path', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const title of ['polygon', 'polygonWithOneInteriorRing', 'multiPolygonWithTwoPolygons']) {
    const testCase = testCases[title];

    if (testCase.wkb) {
      assertTriangulateWKBMatchesEarcutInputs(testCase.wkb, `${title} little endian`);
    }

    if (testCase.wkbXdr) {
      assertTriangulateWKBMatchesEarcutInputs(testCase.wkbXdr, `${title} big endian`);
    }
  }
});

test('triangulateWKB#Z uses XY coordinates', async () => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  for (const title of ['polygon', 'multiPolygonWithTwoPolygons']) {
    const testCase = testCases[title];

    if (testCase.wkb) {
      assertTriangulateWKBMatchesEarcutInputs(testCase.wkb, `${title} Z little endian`);
    }

    if (testCase.wkbXdr) {
      assertTriangulateWKBMatchesEarcutInputs(testCase.wkbXdr, `${title} Z big endian`);
    }
  }
});

test('triangulateWKB#M and ZM use XY coordinates', () => {
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

  assertTriangulateWKBMatchesEarcutInputs(convertGeometryToWKB(polygon, {hasM: true}), 'polygon M');
  assertTriangulateWKBMatchesEarcutInputs(
    convertGeometryToWKB(polygon, {hasZ: true, hasM: true}),
    'polygon ZM'
  );
});

test('triangulateWKB#uses the indexed path for large polygons', () => {
  const ring: Position[] = [];
  for (let index = 0; index < 100; index++) {
    const angle = (index / 100) * Math.PI * 2;
    const radius = index % 2 === 0 ? 10 : 7;
    ring.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  ring.push([...ring[0]]);

  const wkb = convertGeometryToWKB({type: 'Polygon', coordinates: [ring]});
  assertTriangulateWKBMatchesEarcutInputs(wkb, 'large star polygon');

  const firstTriangles = triangulateWKB(wkb);
  const secondTriangles = triangulateWKB(new Uint8Array(wkb));
  expect(firstTriangles).toHaveLength(98 * 3);
  expect(secondTriangles).toEqual(firstTriangles);
});

test('triangulateWKB#handles empty and degenerate polygons', () => {
  const emptyPolygon = convertGeometryToWKB({type: 'Polygon', coordinates: []});
  const degeneratePolygon = convertGeometryToWKB({
    type: 'Polygon',
    coordinates: [[[0, 0]]]
  });

  expect(triangulateWKB(emptyPolygon)).toEqual([]);
  expect(triangulateWKB(degeneratePolygon)).toEqual([]);
});

test('triangulateWKB#handles EWKB SRID metadata without changing indices', () => {
  const polygon = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
        [0, 0]
      ]
    ]
  };
  const plain = triangulateWKB(convertGeometryToWKB(polygon));
  const withSrid = triangulateWKB(convertGeometryToWKB(polygon, {wkb: {srid: 4326}}));
  expect(withSrid).toEqual(plain);
});

test('triangulateWKB#handles all EWKB dimensional flags with SRID metadata', () => {
  const polygon = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [0, 0, 10, 100],
        [4, 0, 20, 200],
        [4, 4, 30, 300],
        [0, 4, 40, 400],
        [0, 0, 10, 100]
      ]
    ]
  };
  const expected = triangulateWKB(
    convertGeometryToWKB({
      type: 'Polygon',
      coordinates: [polygon.coordinates[0].map(position => position.slice(0, 2))]
    })
  );

  expect(triangulateWKB(convertGeometryToWKB(polygon, {hasZ: true, wkb: {srid: 4326}}))).toEqual(
    expected
  );
  expect(triangulateWKB(convertGeometryToWKB(polygon, {hasM: true, wkb: {srid: 4326}}))).toEqual(
    expected
  );
  expect(
    triangulateWKB(convertGeometryToWKB(polygon, {hasZ: true, hasM: true, wkb: {srid: 4326}}))
  ).toEqual(expected);
});

test('triangulateWKB#rejects invalid multipolygon children', () => {
  const bytes = new Uint8Array(
    convertGeometryToWKB({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0],
            [1, 0],
            [0, 1],
            [0, 0]
          ]
        ]
      ]
    })
  );
  bytes[10] = 2;

  expect(() => triangulateWKB(bytes)).toThrow(/must be Polygon geometries/);
});

test('triangulateWKB#rejects non-polygon geometry', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const testCases = parseTestCases(await response.json());

  expect(() => triangulateWKB(testCases.lineString.wkb)).toThrow(
    /Expected Polygon or MultiPolygon/
  );
});

test.each([
  [
    'self intersection',
    [
      [0, 0],
      [4, 4],
      [0, 4],
      [4, 0],
      [0, 0]
    ]
  ],
  [
    'duplicate and collinear vertices',
    [
      [0, 0],
      [2, 0],
      [2, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0]
    ]
  ],
  [
    'narrow concave corridor',
    [
      [0, 0],
      [6, 0],
      [6, 6],
      [4, 6],
      [4, 1],
      [2, 1],
      [2, 6],
      [0, 6],
      [0, 0]
    ]
  ]
])('triangulateWKB#handles difficult %s polygons', (_name, ring) => {
  const wkb = convertGeometryToWKB({type: 'Polygon', coordinates: [ring as Position[]]});
  if (_name === 'self intersection') {
    const triangles = triangulateWKB(wkb);
    expect(triangles.length).toBeGreaterThan(0);
    expect(triangles.every(Number.isInteger)).toBe(true);
  } else {
    assertTriangulateWKBMatchesEarcutInputs(wkb, _name);
  }
});

test('triangulateWKB#handles touching, single-point, and multiple holes', () => {
  const polygon: Geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0]
      ],
      [
        [0, 5],
        [2, 4],
        [2, 6],
        [0, 5]
      ],
      [[5, 5]],
      [
        [7, 7],
        [8, 7],
        [8, 8],
        [7, 8],
        [7, 7]
      ]
    ]
  };
  const triangles = triangulateWKB(convertGeometryToWKB(polygon));
  expect(triangles.length).toBeGreaterThan(0);
  expect(triangles.every(Number.isInteger)).toBe(true);
});

/**
 * Verifies direct WKB triangulation against the existing GeoJSON-to-earcut path.
 * @param wkb WKB input.
 * @param title Assertion title.
 */
function assertTriangulateWKBMatchesEarcutInputs(wkb: ArrayBuffer, title: string): void {
  const inputs = getGeometryEarcutInputs(convertWKBToGeometry(wkb));
  const expectedTriangles = inputs.flatMap(input =>
    earcut(input.positions, input.holeIndices, input.dimensions).map(
      triangleIndex => triangleIndex + input.vertexOffset
    )
  );
  const triangles = triangulateWKB(wkb);

  expect(triangles, `${title} triangles match GeoJSON earcut`).toEqual(expectedTriangles);
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
