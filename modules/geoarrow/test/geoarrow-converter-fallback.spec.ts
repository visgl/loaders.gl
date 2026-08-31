// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import type {GeoArrowEncoding} from '@loaders.gl/schema';

vi.mock('../src/lib/kernels/decode-wkt-native', async importOriginal => {
  const original = await importOriginal<typeof import('../src/lib/kernels/decode-wkt-native')>();
  return {
    ...original,
    decodeWKTNativeVector: vi.fn(() => null),
    decodeWKTUnionVector: vi.fn(() => null),
    decodeWKTGeometryCollectionVector: vi.fn(() => null)
  };
});

/** Loads the converter after the optimized WKT kernels have been replaced by declining kernels. */
async function loadFallbackConverter(): Promise<
  typeof import('../src/geoarrow-converter/convert-geoarrow-geometry')
> {
  return await import('../src/geoarrow-converter/convert-geoarrow-geometry');
}

test.each([
  ['geoarrow.point', 'POINT (1 2)', 'FixedSizeList[2]'],
  ['geoarrow.linestring', 'LINESTRING (0 0, 1 1)', 'List'],
  ['geoarrow.polygon', 'POLYGON ((0 0, 1 0, 0 0))', 'List'],
  ['geoarrow.multipoint', 'MULTIPOINT ((1 2), (3 4))', 'List'],
  ['geoarrow.multilinestring', 'MULTILINESTRING ((0 0, 1 1))', 'List'],
  ['geoarrow.multipolygon', 'MULTIPOLYGON (((0 0, 1 0, 0 0)))', 'List']
] as const)('compatibility fallback converts WKT to %s interleaved coordinates', async (targetEncoding, wkt, expectedType) => {
  const {convertGeoArrowVector} = await loadFallbackConverter();
  const result = convertGeoArrowVector(
    arrow.vectorFromArray([wkt, null], new arrow.Utf8()),
    'geoarrow.wkt',
    targetEncoding,
    {fallback: 'geojson'}
  );
  expect(result.length).toBe(2);
  expect(result.type.toString()).toContain(expectedType);
  expect(result.get(1)).toBeNull();
});

test.each([
  ['geoarrow.point', 'POINT ZM (1 2 3 4)'],
  ['geoarrow.linestring', 'LINESTRING ZM (0 1 2 3, 4 5 6 7)'],
  ['geoarrow.polygon', 'POLYGON ZM ((0 0 1 2, 1 0 3 4, 0 0 1 2))'],
  ['geoarrow.multipoint', 'MULTIPOINT ZM ((1 2 3 4), (5 6 7 8))'],
  ['geoarrow.multilinestring', 'MULTILINESTRING ZM ((0 0 1 2, 3 4 5 6))'],
  ['geoarrow.multipolygon', 'MULTIPOLYGON ZM (((0 0 1 2, 1 0 3 4, 0 0 1 2)))']
] as const)('compatibility fallback converts WKT to separated large-offset %s coordinates', async (targetEncoding, wkt) => {
  const {convertGeoArrowVector} = await loadFallbackConverter();
  const result = convertGeoArrowVector(
    arrow.vectorFromArray([wkt], new arrow.Utf8()),
    'geoarrow.wkt',
    targetEncoding,
    {
      fallback: 'geojson',
      coordinates: 'separated',
      dimension: 'xyzm',
      offsetType: 'int64'
    }
  );
  expect(result.length).toBe(1);
  expect(result.type.toString()).toMatch(/Struct|LargeList/);
});

test('compatibility fallback builds a dense union with every geometry family and null carrier', async () => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const wkts = [
    'POINT (1 2)',
    'LINESTRING (0 0, 1 1)',
    'POLYGON ((0 0, 1 0, 0 0))',
    'MULTIPOINT ((1 2), (3 4))',
    'MULTILINESTRING ((0 0, 1 1))',
    'MULTIPOLYGON (((0 0, 1 0, 0 0)))',
    'GEOMETRYCOLLECTION (POINT (9 8), LINESTRING (1 2, 3 4))',
    null
  ];
  const union = convertGeoArrowVector(
    arrow.vectorFromArray(wkts, new arrow.Utf8()),
    'geoarrow.wkt',
    'geoarrow.geometry',
    {
      fallback: 'geojson',
      geometryTypes: [
        'Point',
        'LineString',
        'Polygon',
        'MultiPoint',
        'MultiLineString',
        'MultiPolygon',
        'GeometryCollection'
      ]
    }
  );

  expect(union.type).toBeInstanceOf(arrow.DenseUnion);
  expect((union.type as arrow.DenseUnion).children.map(field => field.name)).toEqual([
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection'
  ]);
  expect(
    wkts.map(
      (_, rowIndex) =>
        convertGeoArrowVectorCellToGeoJSON(union, rowIndex, 'geoarrow.geometry')?.type || null
    )
  ).toEqual([
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection',
    null
  ]);
});

test('compatibility fallback builds nullable separated GeometryCollections with large offsets', async () => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const collection = convertGeoArrowVector(
    arrow.vectorFromArray(
      [
        'GEOMETRYCOLLECTION (POINT Z (1 2 3), LINESTRING Z (0 0 0, 1 1 1))',
        'GEOMETRYCOLLECTION EMPTY',
        null
      ],
      new arrow.Utf8()
    ),
    'geoarrow.wkt',
    'geoarrow.geometrycollection',
    {
      fallback: 'geojson',
      coordinates: 'separated',
      dimension: 'xyz',
      offsetType: 'int64',
      geometryTypes: ['GeometryCollection Z']
    }
  );

  expect(collection.type).toBeInstanceOf(arrow.LargeList);
  expect(collection.nullCount).toBe(1);
  expect(convertGeoArrowVectorCellToGeoJSON(collection, 0, 'geoarrow.geometrycollection')).toEqual({
    type: 'GeometryCollection',
    geometries: [
      {type: 'Point', coordinates: [1, 2, 3]},
      {
        type: 'LineString',
        coordinates: [
          [0, 0, 0],
          [1, 1, 1]
        ]
      }
    ]
  });
  expect(convertGeoArrowVectorCellToGeoJSON(collection, 1, 'geoarrow.geometrycollection')).toEqual({
    type: 'GeometryCollection',
    geometries: []
  });
  expect(
    convertGeoArrowVectorCellToGeoJSON(collection, 2, 'geoarrow.geometrycollection')
  ).toBeNull();
});

test('compatibility fallback preserves WKT coordinate arity through WKB and back', async () => {
  const {convertGeoArrowVector} = await loadFallbackConverter();
  const source = arrow.vectorFromArray(
    ['POINT (1 2)', 'POINT Z (3 4 5)', 'POINT M (6 7 8)', 'POINT ZM (9 10 11 12)', null],
    new arrow.Utf8()
  );
  const wkb = convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.wkb', {
    fallback: 'geojson'
  });
  const roundTrip = convertGeoArrowVector(wkb, 'geoarrow.wkb', 'geoarrow.wkt', {
    fallback: 'geojson'
  });
  expect(Array.from({length: roundTrip.length}, (_, index) => roundTrip.get(index))).toEqual([
    'POINT (1 2)',
    'POINT Z (3 4 5)',
    'POINT Z (6 7 8)',
    'POINT ZM (9 10 11 12)',
    null
  ]);
});

test.each([
  ['geoarrow.point', 'LINESTRING (0 0, 1 1)', 'cannot encode LineString'],
  ['geoarrow.linestring', 'POINT (1 2)', 'cannot encode Point'],
  ['geoarrow.polygon', 'POINT (1 2)', 'cannot encode Point'],
  ['geoarrow.multilinestring', 'POINT (1 2)', 'cannot encode Point'],
  ['geoarrow.multipolygon', 'POINT (1 2)', 'cannot encode Point']
] as const)('compatibility fallback rejects incompatible %s geometry families', async (targetEncoding, wkt, message) => {
  const {convertGeoArrowVector} = await loadFallbackConverter();
  expect(() =>
    convertGeoArrowVector(
      arrow.vectorFromArray([wkt], new arrow.Utf8()),
      'geoarrow.wkt',
      targetEncoding,
      {fallback: 'geojson'}
    )
  ).toThrow(message);
});

test('compatibility fallback rejects non-collections, recursive collections, and disabled fallback', async () => {
  const {convertGeoArrowVector} = await loadFallbackConverter();
  expect(() =>
    convertGeoArrowVector(
      arrow.vectorFromArray(['POINT (1 2)'], new arrow.Utf8()),
      'geoarrow.wkt',
      'geoarrow.geometrycollection',
      {fallback: 'geojson'}
    )
  ).toThrow('cannot encode Point as geoarrow.geometrycollection');

  expect(() =>
    convertGeoArrowVector(
      arrow.vectorFromArray(
        ['GEOMETRYCOLLECTION (GEOMETRYCOLLECTION (POINT (1 2)))'],
        new arrow.Utf8()
      ),
      'geoarrow.wkt',
      'geoarrow.geometry',
      {fallback: 'geojson'}
    )
  ).toThrow('do not support recursive GeometryCollections');

  expect(() =>
    convertGeoArrowVector(
      arrow.vectorFromArray(['POINT (1 2)'], new arrow.Utf8()),
      'geoarrow.wkt',
      'geoarrow.point',
      {fallback: 'error'}
    )
  ).toThrow('No direct GeoArrow conversion kernel');
});

test.each([
  Number.NaN,
  -1,
  1.5,
  Number.MAX_SAFE_INTEGER + 1
])('conversion rejects invalid GeometryCollection depth %s before dispatch', async maximumDepth => {
  const {convertGeoArrowVector} = await loadFallbackConverter();
  expect(() =>
    convertGeoArrowVector(
      arrow.vectorFromArray(['POINT (1 2)'], new arrow.Utf8()),
      'geoarrow.wkt',
      'geoarrow.point',
      {maxGeometryCollectionDepth: maximumDepth}
    )
  ).toThrow('non-negative safe integer');
});

test('compatibility fallback selects dimension bands from declared geometry types', async () => {
  const {convertGeoArrowVector} = await loadFallbackConverter();
  const cases: [string, GeoArrowEncoding, string][] = [
    ['POINT Z (1 2 3)', 'geoarrow.point', 'Point Z'],
    ['POINT M (1 2 3)', 'geoarrow.point', 'Point M'],
    ['POINT ZM (1 2 3 4)', 'geoarrow.point', 'Point ZM']
  ];
  for (const [wkt, targetEncoding, geometryType] of cases) {
    const result = convertGeoArrowVector(
      arrow.vectorFromArray([wkt], new arrow.Utf8()),
      'geoarrow.wkt',
      targetEncoding,
      {fallback: 'geojson', geometryTypes: [geometryType as any]}
    );
    expect(result.length).toBe(1);
  }
});
