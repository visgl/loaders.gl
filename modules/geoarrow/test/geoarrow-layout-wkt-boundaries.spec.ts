// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {inspectGeoArrowLayout} from '@loaders.gl/geoarrow';
import type {GeoArrowEncoding} from '@loaders.gl/schema';
import {
  decodeWKTGeometryCollectionVector,
  decodeWKTNativeVector,
  decodeWKTUnionVector
} from '../src/lib/kernels/decode-wkt-native';

/** Creates GeoArrow extension metadata for a field. */
function extensionMetadata(encoding?: GeoArrowEncoding): Map<string, string> {
  return encoding ? new Map([['ARROW:extension:name', encoding]]) : new Map();
}

/** Creates an interleaved coordinate type. */
function coordinateType(
  size: number,
  scalar: arrow.DataType = new arrow.Float64()
): arrow.FixedSizeList {
  return new arrow.FixedSizeList(size, new arrow.Field('item', scalar, true));
}

/** Creates the minimum row-oriented Arrow vector needed by WKT kernels. */
function wktVector(values: unknown[]): arrow.Vector {
  return {
    type: new arrow.Utf8(),
    length: values.length,
    data: [],
    get: (index: number) => values[index]
  } as unknown as arrow.Vector;
}

test('layout oracle classifies all serialized storage families and missing metadata', () => {
  const cases: [arrow.DataType, GeoArrowEncoding, string][] = [
    [new arrow.Binary(), 'geoarrow.wkb', 'binary'],
    [new arrow.LargeBinary(), 'geoarrow.wkb', 'large-binary'],
    [new arrow.BinaryView(), 'geoarrow.wkb', 'binary-view'],
    [new arrow.Utf8(), 'geoarrow.wkt', 'utf8'],
    [new arrow.LargeUtf8(), 'geoarrow.wkt', 'large-utf8'],
    [new arrow.Utf8View(), 'geoarrow.wkt', 'utf8-view']
  ];
  for (const [type, encoding, storage] of cases) {
    expect(
      inspectGeoArrowLayout(new arrow.Field('geometry', type, true, extensionMetadata(encoding)))
    ).toMatchObject({valid: true, layout: {encoding, storage}});
  }

  const missing = inspectGeoArrowLayout(
    new arrow.Field('geometry', coordinateType(2), true, extensionMetadata())
  );
  expect(missing.valid).toBe(false);
  expect(missing.layout).toMatchObject({kind: 'point', dimension: 'xy'});
  expect(missing.issues.map(issue => issue.code)).toEqual(['missing-extension']);
});

test.each([
  ['geoarrow.wkb', new arrow.Utf8()],
  ['geoarrow.wkt', new arrow.Binary()],
  ['geoarrow.geometry', coordinateType(2)],
  ['geoarrow.geometrycollection', coordinateType(2)],
  ['geoarrow.box', coordinateType(2)],
  ['geoarrow.point', new arrow.Int32()]
] as const)('layout oracle rejects %s on incompatible physical storage', (encoding, type) => {
  const result = inspectGeoArrowLayout(
    new arrow.Field('geometry', type, true, extensionMetadata(encoding))
  );
  expect(result.valid).toBe(false);
  expect(
    result.issues.some(issue => ['wrong-physical-type', 'unsupported-type'].includes(issue.code))
  ).toBe(true);
});

test('layout oracle diagnoses native depth, dimension, names, and precision boundaries', () => {
  const malformedFields = [
    new arrow.Field('geometry', coordinateType(2), true, extensionMetadata('geoarrow.linestring')),
    new arrow.Field(
      'geometry',
      new arrow.List(new arrow.Field('item', coordinateType(2), true)),
      true,
      extensionMetadata('geoarrow.polygon')
    ),
    new arrow.Field('geometry', coordinateType(1), true, extensionMetadata('geoarrow.point')),
    new arrow.Field('geometry', coordinateType(5), true, extensionMetadata('geoarrow.point')),
    new arrow.Field(
      'geometry',
      coordinateType(2, new arrow.Int32()),
      true,
      extensionMetadata('geoarrow.point')
    ),
    new arrow.Field(
      'geometry',
      coordinateType(2, new arrow.Float16()),
      true,
      extensionMetadata('geoarrow.point')
    ),
    new arrow.Field(
      'geometry',
      new arrow.Struct([new arrow.Field('x', new arrow.Float64(), true)]),
      true,
      extensionMetadata('geoarrow.point')
    ),
    new arrow.Field(
      'geometry',
      new arrow.Struct([
        new arrow.Field('x', new arrow.Float32(), true),
        new arrow.Field('y', new arrow.Float64(), false),
        new arrow.Field('measure', new arrow.Float64(), true),
        new arrow.Field('extra', new arrow.Float64(), true),
        new arrow.Field('overflow', new arrow.Float64(), true)
      ]),
      true,
      extensionMetadata('geoarrow.point')
    )
  ];
  const codes = new Set(
    malformedFields.flatMap(field => inspectGeoArrowLayout(field).issues.map(issue => issue.code))
  );
  expect(codes).toEqual(
    new Set([
      'wrong-child-count',
      'wrong-coordinate-dimension',
      'wrong-coordinate-precision',
      'wrong-child-name'
    ])
  );
});

test('layout oracle reports mixed offsets and exact separated Box dimensions', () => {
  const mixedOffsets = new arrow.LargeList(
    new arrow.Field(
      'outer',
      new arrow.List(new arrow.Field('inner', coordinateType(2), true)),
      true
    )
  );
  const mixed = inspectGeoArrowLayout(
    new arrow.Field('geometry', mixedOffsets, true, extensionMetadata('geoarrow.polygon'))
  );
  expect(mixed.issues.some(issue => issue.code === 'mixed-offset-width')).toBe(true);
  expect(mixed.layout.offsetTypes).toEqual(['int64', 'int32']);

  const boxCases: [string[], string][] = [
    [['xmin', 'ymin', 'xmax', 'ymax'], 'xy'],
    [['xmin', 'ymin', 'zmin', 'xmax', 'ymax', 'zmax'], 'xyz'],
    [['xmin', 'ymin', 'mmin', 'xmax', 'ymax', 'mmax'], 'xym'],
    [['xmin', 'ymin', 'zmin', 'mmin', 'xmax', 'ymax', 'zmax', 'mmax'], 'xyzm']
  ];
  for (const [names, dimension] of boxCases) {
    const field = new arrow.Field(
      'geometry',
      new arrow.Struct(
        names.map(
          (name, index) =>
            new arrow.Field(name, index % 2 ? new arrow.Float32() : new arrow.Float64(), true)
        )
      ),
      true,
      extensionMetadata('geoarrow.box')
    );
    expect(inspectGeoArrowLayout(field)).toMatchObject({
      valid: true,
      layout: {kind: 'box', dimension, coordinates: 'separated'}
    });
  }
});

test('layout oracle diagnoses dense-union IDs, unknown children, and collection structure', () => {
  const invalidIds = new arrow.DenseUnion(
    [1, 99, 200],
    [
      new arrow.Field('Point', coordinateType(2), true),
      new arrow.Field('Mystery', coordinateType(2), true),
      new arrow.Field('LineString', coordinateType(2), true)
    ]
  );
  const invalid = inspectGeoArrowLayout(
    new arrow.Field('geometry', invalidIds, true, extensionMetadata('geoarrow.geometry'))
  );
  expect(invalid.issues.some(issue => issue.code === 'invalid-union')).toBe(true);
  expect(invalid.issues.some(issue => issue.code === 'unknown-union-child')).toBe(true);

  const collectionChild = new arrow.List(
    new arrow.Field(
      'geometries',
      new arrow.DenseUnion([1], [new arrow.Field('Point', coordinateType(2), true)]),
      true
    )
  );
  const union = new arrow.DenseUnion(
    [7],
    [new arrow.Field('GeometryCollection', collectionChild, true)]
  );
  expect(
    inspectGeoArrowLayout(
      new arrow.Field('geometry', union, true, extensionMetadata('geoarrow.geometrycollection'))
    ).issues.some(issue => issue.message.includes('requires a list'))
  ).toBe(true);

  const malformedCollectionUnion = new arrow.DenseUnion(
    [7],
    [new arrow.Field('GeometryCollection', coordinateType(2), true)]
  );
  expect(
    inspectGeoArrowLayout(
      new arrow.Field(
        'geometry',
        malformedCollectionUnion,
        true,
        extensionMetadata('geoarrow.geometry')
      )
    ).issues.some(issue => issue.message.includes('list of dense union'))
  ).toBe(true);
});

test.each([
  'SRID 4326;POINT (1 2)',
  'SRID=bad;POINT (1 2)',
  'SRID=4326 POINT (1 2)',
  'UNKNOWN (1 2)',
  'POINT 1 2',
  'POINT (1)',
  'POINT Z (1 2)',
  'POINT (1 2) trailing',
  'LINESTRING (0 0, bad)',
  'POLYGON (0 0, 1 1)',
  'POLYGON ((0 0, 1 1)',
  'MULTIPOINT ((1 2), bad)',
  'MULTILINESTRING ((0 0), bad)',
  'MULTIPOLYGON (((0 0)), bad)',
  'GEOMETRYCOLLECTION (POINT (1 2), bad)'
])('direct WKT decoders reject malformed grammar: %s', wkt => {
  const vector = wktVector([wkt]);
  expect(decodeWKTNativeVector(vector, 'geoarrow.point')).toBeNull();
  expect(decodeWKTUnionVector(vector)).toBeNull();
  expect(decodeWKTGeometryCollectionVector(vector)).toBeNull();
});

test('direct WKT native decoder covers nulls, empty geometries, number syntax, and mixed dimensions', () => {
  const emptyCases: [GeoArrowEncoding, string][] = [
    ['geoarrow.point', 'POINT EMPTY'],
    ['geoarrow.linestring', 'LINESTRING EMPTY'],
    ['geoarrow.polygon', 'POLYGON EMPTY'],
    ['geoarrow.multipoint', 'MULTIPOINT EMPTY'],
    ['geoarrow.multilinestring', 'MULTILINESTRING EMPTY'],
    ['geoarrow.multipolygon', 'MULTIPOLYGON EMPTY']
  ];
  for (const [encoding, wkt] of emptyCases) {
    const result = decodeWKTNativeVector(
      wktVector([null, wkt]),
      encoding as Exclude<
        GeoArrowEncoding,
        | 'geoarrow.box'
        | 'geoarrow.geometry'
        | 'geoarrow.geometrycollection'
        | 'geoarrow.wkb'
        | 'geoarrow.wkt'
      >
    );
    expect(result?.length).toBe(2);
  }

  expect(
    decodeWKTNativeVector(wktVector(['POINT (+1.5 -2.5e1)', 'POINT (.5 2.)']), 'geoarrow.point')
      ?.length
  ).toBe(2);
  expect(
    decodeWKTNativeVector(wktVector(['POINT (1 2)', 'POINT Z (1 2 3)']), 'geoarrow.point')
  ).toBeNull();
  expect(decodeWKTNativeVector(wktVector([42]), 'geoarrow.point')).toBeNull();
  expect(
    decodeWKTNativeVector(wktVector([null]), 'geoarrow.point', undefined, 'separated', 'int64')
      ?.length
  ).toBe(1);
});

test('direct WKT union and collection kernels cover null-only, seeded, and recursive cases', () => {
  const nullUnion = decodeWKTUnionVector(wktVector([null, null]), undefined, 'separated', 'int64');
  expect(nullUnion?.length).toBe(2);
  expect((nullUnion?.type as arrow.DenseUnion).children[0].name).toBe('Point');

  const seeded = decodeWKTUnionVector(
    wktVector(['POINT M (1 2 3)', null]),
    undefined,
    'interleaved',
    'int32',
    ['LineString Z', 'Point M', 'GeometryCollection']
  );
  expect((seeded?.type as arrow.DenseUnion).children.map(field => field.name)).toEqual([
    'GeometryCollection',
    'LineString Z',
    'Point M'
  ]);

  const nullCollection = decodeWKTGeometryCollectionVector(
    wktVector([null, 'GEOMETRYCOLLECTION EMPTY']),
    undefined,
    'separated',
    'int64',
    ['GeometryCollection', 'Point']
  );
  expect(nullCollection?.type).toBeInstanceOf(arrow.LargeList);
  expect(nullCollection?.nullCount).toBe(1);

  expect(
    decodeWKTGeometryCollectionVector(
      wktVector(['GEOMETRYCOLLECTION (GEOMETRYCOLLECTION (POINT (1 2)))'])
    )
  ).toBeNull();
  expect(
    decodeWKTUnionVector(
      wktVector(['GEOMETRYCOLLECTION (POINT (1 2))']),
      undefined,
      'interleaved',
      'int32',
      undefined,
      0
    )
  ).toBeNull();
});
