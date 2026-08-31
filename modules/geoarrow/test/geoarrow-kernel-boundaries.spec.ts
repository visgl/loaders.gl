// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry,
  getGeoArrowBounds,
  getGeoArrowNativeGeometry,
  getGeoArrowRowBounds,
  inspectGeoArrowVector
} from '@loaders.gl/geoarrow';
import type {GeoArrowEncoding} from '@loaders.gl/schema';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import {encodeGeoArrowBoxVector} from '../src/lib/kernels/encode-geoarrow-box';
import {encodeGeoArrowWKTVector} from '../src/lib/kernels/encode-geoarrow-wkt';

/** Creates the minimum vector surface needed by row-oriented boundary kernels. */
function makeValueVector(values: unknown[], type: arrow.DataType = new arrow.Null()): arrow.Vector {
  return {
    length: values.length,
    type,
    data: [],
    get: (index: number) => values[index]
  } as unknown as arrow.Vector;
}

/** Creates an Arrow-like nested value that deliberately uses `get()` traversal. */
function makeVectorValue(values: unknown[]): {length: number; get(index: number): unknown} {
  return {length: values.length, get: index => values[index]};
}

test('GeoArrow scalar bounds traverse every supported row representation', () => {
  const vectorValue = makeVectorValue([
    {x: -4, y: 8},
    {toArray: () => Float64Array.of(9, -2)},
    [Number.NaN, 100],
    null
  ]);

  expect(getGeoArrowBounds(null, 'geoarrow.point')).toBeNull();
  expect(getGeoArrowBounds({xmin: 1, ymin: 2, xmax: 3, ymax: 4}, 'geoarrow.box')).toEqual([
    1, 2, 3, 4
  ]);
  expect(getGeoArrowBounds({xmin: 'bad'}, 'geoarrow.box')).toBeNull();
  expect(getGeoArrowBounds({x: 3, y: 5}, 'geoarrow.point')).toEqual([3, 5, 3, 5]);
  expect(getGeoArrowBounds({x: 3, y: 'bad'}, 'geoarrow.point')).toBeNull();
  expect(getGeoArrowBounds({toArray: () => Float32Array.of(-1, 7)}, 'geoarrow.point')).toEqual([
    -1, 7, -1, 7
  ]);
  expect(getGeoArrowBounds(vectorValue, 'geoarrow.multilinestring')).toEqual([-4, -2, 9, 8]);
  expect(
    getGeoArrowBounds(
      [Float64Array.of(1, 2), [7, 9], ['bad', 3], Number.POSITIVE_INFINITY],
      'geoarrow.linestring'
    )
  ).toEqual([1, 2, 7, 9]);
  expect(getGeoArrowBounds([['bad']], 'geoarrow.linestring')).toBeNull();

  const pointWKB = new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [-7, 11]}));
  expect(getGeoArrowBounds(pointWKB, 'geoarrow.wkb')).toEqual([-7, 11, -7, 11]);
});

test('GeoArrow Box kernel covers nested, separated, dimensional, null, WKT, and WKB rows', () => {
  const rows = [
    null,
    {xmin: -1, ymin: -2, xmax: 8, ymax: 9, zmin: 1, zmax: 5, mmin: 10, mmax: 20},
    {coordinates: [[1, 2, 3, 4], {x: 5, y: 6, z: 7, m: 8}]},
    {geometries: makeVectorValue([{toArray: () => Float64Array.of(-5, -6, -7, -8)}])},
    makeVectorValue([Float32Array.of(2, 3, 4, 5)]),
    {coordinates: ['bad']}
  ];
  const source = makeValueVector(rows);

  for (const dimension of ['xy', 'xyz', 'xym', 'xyzm'] as const) {
    const boxes = encodeGeoArrowBoxVector(source, 'geoarrow.geometry', dimension);
    expect(boxes.length).toBe(rows.length);
    expect(boxes.nullCount).toBe(2);
    expect(boxes.type.toString()).toContain('Struct');
  }

  const inferred = encodeGeoArrowBoxVector(source, 'geoarrow.geometry');
  expect(inferred.type.toString()).toContain('zmin');

  const wkt = encodeGeoArrowBoxVector(
    makeValueVector(['POINT M (1 2 3)', 'LINESTRING EMPTY', null], new arrow.Utf8()),
    'geoarrow.wkt',
    'xym'
  );
  expect(wkt.length).toBe(3);
  expect(wkt.nullCount).toBe(2);

  const wkbValues = [
    new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]})),
    new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [3, 4, 5]})),
    null
  ];
  const wkb = encodeGeoArrowBoxVector(
    makeValueVector(wkbValues, new arrow.Binary()),
    'geoarrow.wkb'
  );
  expect(wkb.length).toBe(3);
  expect(wkb.nullCount).toBe(1);
});

test.each([
  ['geoarrow.point', {x: 1, y: 2}, 'POINT (1 2)'],
  ['geoarrow.point', {toArray: () => Float64Array.of(1, 2, 3)}, 'POINT Z (1 2 3)'],
  ['geoarrow.linestring', makeVectorValue([[0, 1], {x: 2, y: 3}]), 'LINESTRING (0 1, 2 3)'],
  ['geoarrow.linestring', [], 'LINESTRING EMPTY'],
  [
    'geoarrow.polygon',
    [
      [
        [0, 0],
        [1, 0],
        [0, 0]
      ]
    ],
    'POLYGON ((0 0, 1 0, 0 0))'
  ],
  ['geoarrow.polygon', [], 'POLYGON EMPTY'],
  ['geoarrow.multipoint', [[1, 2], Float64Array.of(3, 4)], 'MULTIPOINT ((1 2), (3 4))'],
  ['geoarrow.multipoint', [], 'MULTIPOINT EMPTY'],
  [
    'geoarrow.multilinestring',
    [
      [
        [0, 0],
        [1, 1]
      ],
      makeVectorValue([
        [2, 2],
        [3, 3]
      ])
    ],
    'MULTILINESTRING ((0 0, 1 1), (2 2, 3 3))'
  ],
  ['geoarrow.multilinestring', [], 'MULTILINESTRING EMPTY'],
  [
    'geoarrow.multipolygon',
    [
      [
        [
          [0, 0],
          [1, 0],
          [0, 0]
        ]
      ]
    ],
    'MULTIPOLYGON (((0 0, 1 0, 0 0)))'
  ],
  ['geoarrow.multipolygon', [], 'MULTIPOLYGON EMPTY']
] as const)('native WKT kernel traverses %s row representations', (encoding, value, expectedWKT) => {
  const vector = makeValueVector([value]);
  const dimension = expectedWKT.includes(' Z ') ? 'xyz' : 'xy';
  const encoded = encodeGeoArrowWKTVector(vector, encoding, dimension);
  expect(encoded?.get(0)).toBe(expectedWKT);
});

test('native WKT kernel rejects malformed shapes and non-native encodings conservatively', () => {
  const malformedCases: [GeoArrowEncoding, unknown][] = [
    ['geoarrow.linestring', {not: 'children'}],
    ['geoarrow.linestring', [[1]]],
    ['geoarrow.polygon', [{not: 'a ring'}]],
    ['geoarrow.multipoint', [[1]]],
    ['geoarrow.multilinestring', [{not: 'a line'}]],
    ['geoarrow.multipolygon', [{not: 'a polygon'}]]
  ];
  for (const [encoding, value] of malformedCases) {
    expect(encodeGeoArrowWKTVector(makeValueVector([value]), encoding)).toBeNull();
  }
  expect(encodeGeoArrowWKTVector(makeValueVector(['POINT (1 2)']), 'geoarrow.wkt')).toBeNull();
  expect(encodeGeoArrowWKTVector(makeValueVector([null]), 'geoarrow.point')?.get(0)).toBeNull();
});

test('native geometry reader covers every concrete family and malformed rows', () => {
  const cases: [GeoArrowEncoding, unknown, string][] = [
    ['geoarrow.point', {x: 1, y: 2, z: 3, m: 4}, 'Point'],
    [
      'geoarrow.linestring',
      makeVectorValue([
        [0, 0],
        [1, 1]
      ]),
      'LineString'
    ],
    [
      'geoarrow.polygon',
      [
        [
          [0, 0],
          [1, 0],
          [0, 0]
        ]
      ],
      'Polygon'
    ],
    ['geoarrow.multipoint', [Float64Array.of(1, 2), [3, 4]], 'MultiPoint'],
    [
      'geoarrow.multilinestring',
      [
        [
          [0, 0],
          [1, 1]
        ]
      ],
      'MultiLineString'
    ],
    [
      'geoarrow.multipolygon',
      [
        [
          [
            [0, 0],
            [1, 0],
            [0, 0]
          ]
        ]
      ],
      'MultiPolygon'
    ]
  ];
  for (const [encoding, value, expectedType] of cases) {
    expect(getGeoArrowNativeGeometry(makeValueVector([value]), 0, encoding)?.type).toBe(
      expectedType
    );
  }

  const point = makeValueVector([{toArray: () => Float32Array.of(7, 8)}]);
  expect(getGeoArrowNativeGeometry(point, 0, 'geoarrow.point')).toEqual({
    type: 'Point',
    coordinates: [7, 8]
  });
  expect(getGeoArrowNativeGeometry(makeValueVector([[1, 'bad']]), 0, 'geoarrow.point')).toBeNull();
  expect(
    getGeoArrowNativeGeometry(makeValueVector([{x: 1, y: 'bad'}]), 0, 'geoarrow.point')
  ).toBeNull();
  expect(getGeoArrowNativeGeometry(point, -1, 'geoarrow.point')).toBeNull();
  expect(getGeoArrowNativeGeometry(point, 1, 'geoarrow.point')).toBeNull();
  expect(getGeoArrowNativeGeometry(point, 0, 'geoarrow.box')).toBeNull();
  expect(getGeoArrowNativeGeometry(point, 0, 'geoarrow.wkb')).toBeNull();
});

test('union and collection readers inspect, bound, and decode all native geometry families', () => {
  const features: any[] = [
    {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-1, 4],
          [8, -3]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [2, 0],
            [0, 0]
          ]
        ]
      }
    },
    {type: 'Feature', properties: {}, geometry: {type: 'MultiPoint', coordinates: [[3, 4]]}},
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [5, 6],
            [7, 8]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [9, 9],
              [10, 9],
              [9, 9]
            ]
          ]
        ]
      }
    },
    {type: 'Feature', properties: {}, geometry: null}
  ];
  const source = convertFeaturesToGeoArrowTable(features).data;
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry').getChild('geometry')!;
  const inspection = inspectGeoArrowVector(union, 'geoarrow.geometry');
  expect(inspection.geometryTypes).toEqual([
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon'
  ]);
  expect(getGeoArrowRowBounds(union, 'geoarrow.geometry')).toHaveLength(features.length);
  expect(getGeoArrowNativeGeometry(union, 5, 'geoarrow.geometry')?.type).toBe('MultiPolygon');

  const collectionSource = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'GeometryCollection',
        geometries: [features[0].geometry, features[1].geometry]
      }
    },
    {type: 'Feature', properties: {}, geometry: null}
  ] as any).data;
  const collection = convertGeoArrowGeometry(
    collectionSource,
    'geoarrow.geometrycollection'
  ).getChild('geometry')!;
  expect(inspectGeoArrowVector(collection, 'geoarrow.geometrycollection')).toMatchObject({
    rowCount: 2,
    nullCount: 1,
    geometryTypes: ['GeometryCollection']
  });
  expect(getGeoArrowNativeGeometry(collection, 0, 'geoarrow.geometrycollection')).toMatchObject({
    type: 'GeometryCollection',
    geometries: [{type: 'Point'}, {type: 'LineString'}]
  });
  expect(getGeoArrowNativeGeometry(collection, 1, 'geoarrow.geometrycollection')).toBeNull();
});

test('vector inspection covers malformed serialized and native dimension variants', () => {
  const wkt = makeValueVector(
    [null, 'POINT (1 2)', 'POINT Z (1 2 3)', 'POINT M (1 2 3)', 'POINT ZM (1 2 3 4)', 'bad'],
    new arrow.Utf8()
  );
  expect(inspectGeoArrowVector(wkt, 'geoarrow.wkt')).toMatchObject({
    nullCount: 1,
    malformedRowCount: 1,
    dimensions: ['xy', 'xyz', 'xym', 'xyzm']
  });

  const malformedWKB = makeValueVector(
    [null, new Uint8Array(), Uint8Array.of(2, 1, 0)],
    new arrow.Binary()
  );
  expect(inspectGeoArrowVector(malformedWKB, 'geoarrow.wkb')).toMatchObject({
    nullCount: 1,
    malformedRowCount: 2
  });

  const types = [
    new arrow.FixedSizeList(2, new arrow.Field('item', new arrow.Float64(), true)),
    new arrow.FixedSizeList(3, new arrow.Field('item', new arrow.Float64(), true)),
    new arrow.FixedSizeList(4, new arrow.Field('item', new arrow.Float64(), true)),
    new arrow.Struct([
      new arrow.Field('x', new arrow.Float64(), true),
      new arrow.Field('y', new arrow.Float64(), true),
      new arrow.Field('m', new arrow.Float64(), true)
    ]),
    new arrow.List(
      new arrow.Field(
        'item',
        new arrow.FixedSizeList(2, new arrow.Field('item', new arrow.Float64(), true)),
        true
      )
    )
  ];
  const encodings: GeoArrowEncoding[] = [
    'geoarrow.point',
    'geoarrow.point',
    'geoarrow.point',
    'geoarrow.point',
    'geoarrow.linestring'
  ];
  expect(
    types.map(
      (type, index) =>
        inspectGeoArrowVector(makeValueVector([[1, 2]], type), encodings[index]).dimensions
    )
  ).toEqual([['xy'], ['xyz'], ['xyzm'], ['xym'], ['xy']]);
});
