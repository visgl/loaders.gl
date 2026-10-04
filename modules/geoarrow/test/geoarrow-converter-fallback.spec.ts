// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import type {GeoArrowEncoding} from '@loaders.gl/schema';
import type {Geometry} from '@loaders.gl/schema';

vi.mock('../src/lib/kernels/decode-wkt-native', async importOriginal => {
  const original = await importOriginal<typeof import('../src/lib/kernels/decode-wkt-native')>();
  return {
    ...original,
    decodeWKTNativeVector: vi.fn(() => null),
    decodeWKTUnionVector: vi.fn(() => null),
    decodeWKTGeometryCollectionVector: vi.fn(() => null)
  };
});

vi.mock('../src/lib/kernels/encode-geoarrow-wkt', async importOriginal => {
  const original = await importOriginal<typeof import('../src/lib/kernels/encode-geoarrow-wkt')>();
  return {...original, encodeGeoArrowWKTVector: vi.fn(() => null)};
});

/** Loads the converter with declining WKT kernels to exercise the compatibility contract. */
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

test('compatibility fallback extracts every dense-union family back to WKT', async () => {
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
  const source = arrow.vectorFromArray(wkts, new arrow.Utf8());
  const union = convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.geometry', {
    fallback: 'geojson',
    geometryTypes: ['Point', 'GeometryCollection']
  });
  const roundTrip = convertGeoArrowVector(union, 'geoarrow.geometry', 'geoarrow.wkt', {
    fallback: 'geojson'
  });

  expect(
    wkts.map((_, index) => convertGeoArrowVectorCellToGeoJSON(roundTrip, index, 'geoarrow.wkt'))
  ).toEqual(
    wkts.map((_, index) => convertGeoArrowVectorCellToGeoJSON(source, index, 'geoarrow.wkt'))
  );
});

test('compatibility fallback extracts nullable geometry collections to WKB and WKT', async () => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const source = arrow.vectorFromArray(
    [
      'GEOMETRYCOLLECTION (POINT Z (1 2 3), LINESTRING Z (0 0 0, 1 1 1))',
      'GEOMETRYCOLLECTION EMPTY',
      null
    ],
    new arrow.Utf8()
  );
  const collection = convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.geometrycollection', {
    fallback: 'geojson',
    coordinates: 'separated',
    dimension: 'xyz',
    offsetType: 'int64',
    geometryTypes: ['GeometryCollection Z']
  });
  const wkb = convertGeoArrowVector(collection, 'geoarrow.geometrycollection', 'geoarrow.wkb', {
    fallback: 'geojson',
    dimension: 'xyz'
  });
  const roundTrip = convertGeoArrowVector(wkb, 'geoarrow.wkb', 'geoarrow.geometrycollection', {
    fallback: 'geojson',
    dimension: 'xyz',
    geometryTypes: ['GeometryCollection Z']
  });

  expect(convertGeoArrowVectorCellToGeoJSON(roundTrip, 0, 'geoarrow.geometrycollection')).toEqual(
    convertGeoArrowVectorCellToGeoJSON(collection, 0, 'geoarrow.geometrycollection')
  );
  expect(convertGeoArrowVectorCellToGeoJSON(roundTrip, 1, 'geoarrow.geometrycollection')).toEqual({
    type: 'GeometryCollection',
    geometries: []
  });
  expect(
    convertGeoArrowVectorCellToGeoJSON(roundTrip, 2, 'geoarrow.geometrycollection')
  ).toBeNull();
  const text = convertGeoArrowVector(
    collection.slice(0, 3),
    'geoarrow.geometrycollection',
    'geoarrow.wkt',
    {dimension: 'xyz'}
  );
  expect(convertGeoArrowVectorCellToGeoJSON(text, 0, 'geoarrow.wkt')).toEqual(
    convertGeoArrowVectorCellToGeoJSON(collection, 0, 'geoarrow.geometrycollection')
  );
  expect(convertGeoArrowVectorCellToGeoJSON(text, 1, 'geoarrow.wkt')).toEqual({
    type: 'GeometryCollection',
    geometries: []
  });
  expect(text.get(2)).toBeNull();
});

test.each([
  ['geoarrow.point', 'POINT M (1 2 7)', {type: 'Point', coordinates: [1, 2, 7]}],
  [
    'geoarrow.linestring',
    'LINESTRING M (1 2 7, 3 4 8)',
    {
      type: 'LineString',
      coordinates: [
        [1, 2, 7],
        [3, 4, 8]
      ]
    }
  ],
  ['geoarrow.geometry', 'POINT M (1 2 7)', {type: 'Point', coordinates: [1, 2, 7]}]
] as const)('compatibility %s separated XYM conversion keeps the measure under m', async (encoding, text, expectedGeometry) => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const vector = convertGeoArrowVector(
    arrow.vectorFromArray([text, null], new arrow.Utf8()),
    'geoarrow.wkt',
    encoding,
    {coordinates: 'separated', dimension: 'xym', offsetType: 'int64'}
  );
  expect(convertGeoArrowVectorCellToGeoJSON(vector, 0, encoding)).toEqual(expectedGeometry);
  expect(convertGeoArrowVectorCellToGeoJSON(vector, 1, encoding)).toBeNull();
  const coordinate = encoding === 'geoarrow.linestring' ? vector.get(0).get(0) : vector.get(0);
  expect(coordinate.toJSON()).toEqual({x: 1, y: 2, m: 7});
});

test.each([
  ['geoarrow.multipoint', 'POINT Z (1 2 3)', {type: 'MultiPoint', coordinates: [[1, 2, 3, 0]]}],
  [
    'geoarrow.multilinestring',
    'LINESTRING (1 2, 3 4)',
    {
      type: 'MultiLineString',
      coordinates: [
        [
          [1, 2, 0, 0],
          [3, 4, 0, 0]
        ]
      ]
    }
  ],
  [
    'geoarrow.multipolygon',
    'POLYGON ((0 0, 2 0, 0 2, 0 0))',
    {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0, 0, 0],
            [2, 0, 0, 0],
            [0, 2, 0, 0],
            [0, 0, 0, 0]
          ]
        ]
      ]
    }
  ]
] as const)('compatibility %s promotion preserves nesting and pads dimensions explicitly', async (encoding, text, expectedGeometry) => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const vector = convertGeoArrowVector(
    arrow.vectorFromArray([text], new arrow.Utf8()),
    'geoarrow.wkt',
    encoding,
    {dimension: 'xyzm', coordinates: 'separated', offsetType: 'int64'}
  );
  expect(convertGeoArrowVectorCellToGeoJSON(vector, 0, encoding)).toEqual(expectedGeometry);
});

test.each([
  ['geoarrow.point', 'POINT EMPTY', 'Point'],
  ['geoarrow.linestring', 'LINESTRING EMPTY', 'LineString'],
  ['geoarrow.polygon', 'POLYGON EMPTY', 'Polygon'],
  ['geoarrow.multipoint', 'MULTIPOINT EMPTY', 'MultiPoint'],
  ['geoarrow.multilinestring', 'MULTILINESTRING EMPTY', 'MultiLineString'],
  ['geoarrow.multipolygon', 'MULTIPOLYGON EMPTY', 'MultiPolygon']
] as const)('compatibility %s distinguishes empty geometry from a null row', async (encoding, text, geometryKind) => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const vector = convertGeoArrowVector(
    arrow.vectorFromArray([text, null], new arrow.Utf8()),
    'geoarrow.wkt',
    encoding,
    {coordinates: 'separated'}
  );
  expect(vector.isValid(0)).toBe(true);
  expect(convertGeoArrowVectorCellToGeoJSON(vector, 0, encoding)).toEqual({
    type: geometryKind,
    coordinates: []
  });
  expect(convertGeoArrowVectorCellToGeoJSON(vector, 1, encoding)).toBeNull();
});

test('compatibility union null carrier and seeded M children preserve values and schema', async () => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const vector = convertGeoArrowVector(
    arrow.vectorFromArray([null, 'MULTIPOINT M ((1 2 7), (3 4 8))', null], new arrow.Utf8()),
    'geoarrow.wkt',
    'geoarrow.geometry',
    {
      geometryTypes: ['Point M', 'MultiPoint M', 'Polygon M'],
      dimension: 'xym',
      coordinates: 'separated'
    }
  );
  expect(Array.from((vector.type as arrow.DenseUnion).typeIds)).toEqual([21, 23, 24]);
  expect(Array.from(vector.data[0].typeIds)).toEqual([24, 24, 24]);
  expect(Array.from(vector.data[0].valueOffsets)).toEqual([0, 1, 2]);
  expect(
    [0, 1, 2].map(index => convertGeoArrowVectorCellToGeoJSON(vector, index, 'geoarrow.geometry'))
  ).toEqual([
    null,
    {
      type: 'MultiPoint',
      coordinates: [
        [1, 2, 7],
        [3, 4, 8]
      ]
    },
    null
  ]);
  const empty = convertGeoArrowVector(
    arrow.vectorFromArray([null, null], new arrow.Utf8()),
    'geoarrow.wkt',
    'native'
  );
  expect(Array.from((empty.type as arrow.DenseUnion).typeIds)).toEqual([1]);
  expect(empty.get(0)).toBeNull();
  expect(empty.get(1)).toBeNull();
});

test('compatibility serialization enforces nested collection depth before writing bytes', async () => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const source = arrow.vectorFromArray(
    ['GEOMETRYCOLLECTION (GEOMETRYCOLLECTION (POINT (1 2)), POINT (3 4))', null],
    new arrow.Utf8()
  );
  expect(() =>
    convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.wkb', {maxGeometryCollectionDepth: 1})
  ).toThrow('nesting exceeds maxGeometryCollectionDepth (1)');
  const vector = convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.wkb', {
    maxGeometryCollectionDepth: 2
  });
  const expected: Geometry = {
    type: 'GeometryCollection',
    geometries: [
      {type: 'GeometryCollection', geometries: [{type: 'Point', coordinates: [1, 2]}]},
      {type: 'Point', coordinates: [3, 4]}
    ]
  };
  expect(convertGeoArrowVectorCellToGeoJSON(vector, 0, 'geoarrow.wkb')).toEqual(expected);
  expect(vector.get(1)).toBeNull();
});

test.each([
  ['xyz', 'POINT Z (1 2 3)', 'Point Z', 11, [1, 2, 3]],
  ['xyzm', 'POINT ZM (1 2 3 4)', 'Point ZM', 31, [1, 2, 3, 4]]
] as const)('compatibility %s unions use the semantic ID band and preserve sliced values', async (dimension, text, fieldName, typeId, coordinate) => {
  const {convertGeoArrowVector, convertGeoArrowVectorCellToGeoJSON} = await loadFallbackConverter();
  const vector = convertGeoArrowVector(
    arrow.vectorFromArray([null, text, null], new arrow.Utf8()),
    'geoarrow.wkt',
    'geoarrow.geometry',
    {dimension, coordinates: 'separated'}
  );
  expect(Array.from((vector.type as arrow.DenseUnion).typeIds)).toEqual([typeId]);
  expect((vector.type as arrow.DenseUnion).children[0].name).toBe(fieldName);
  const sliced = vector.slice(1, 3);
  expect(convertGeoArrowVectorCellToGeoJSON(sliced, 0, 'geoarrow.geometry')).toEqual({
    type: 'Point',
    coordinates: coordinate
  });
  expect(convertGeoArrowVectorCellToGeoJSON(sliced, 1, 'geoarrow.geometry')).toBeNull();
});
