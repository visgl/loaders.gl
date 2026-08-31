// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry,
  getGeoArrowFieldInfo,
  negotiateGeoArrowEncoding,
  validateGeoArrowField,
  validateGeoArrowVector
} from '@loaders.gl/geoarrow';
import type {GeoArrowEncoding} from '@loaders.gl/schema';

/** Creates a minimal Arrow vector around hand-authored physical data. */
function makeDataVector(type: arrow.DataType, data: Record<string, unknown>): arrow.Vector {
  const physicalData = {
    type,
    length: 1,
    offset: 0,
    nullCount: 0,
    children: [],
    ...data
  };
  return {
    type,
    length: Number(physicalData.length),
    data: [physicalData],
    get: () => null
  } as unknown as arrow.Vector;
}

/** Creates a row-oriented vector for serialized validation branches. */
function makeValueVector(values: unknown[], type: arrow.DataType): arrow.Vector {
  return {
    type,
    length: values.length,
    data: [],
    get: (index: number) => values[index]
  } as unknown as arrow.Vector;
}

/** Creates scalar child data for hand-authored Struct and list layouts. */
function makeScalarData(
  type: arrow.DataType,
  values: ArrayLike<number>,
  length = values.length,
  offset = 0
): Record<string, unknown> {
  return {type, values, length, offset, nullCount: 0, children: []};
}

test('serialized validation reports null, wrong-type, malformed, and valid rows', () => {
  const wkb = validateGeoArrowVector(
    makeValueVector(
      [null, 'not bytes', new Uint8Array(), Uint8Array.of(1, 1, 0, 0, 0)],
      new arrow.Binary()
    ),
    'geoarrow.wkb'
  );
  expect(wkb.valid).toBe(false);
  expect(wkb.issues).toHaveLength(3);
  expect(wkb.issues.map(issue => issue.path)).toEqual(['row[1]', 'row[2]', 'row[3]']);

  const wkt = validateGeoArrowVector(
    makeValueVector([null, 42, 'not wkt', 'POINT (1 2)'], new arrow.Utf8()),
    'geoarrow.wkt'
  );
  expect(wkt.valid).toBe(false);
  expect(wkt.issues.map(issue => issue.path)).toEqual(['row[1]', 'row[2]']);

  expect(
    validateGeoArrowVector(
      makeValueVector([], new arrow.Null()),
      'geoarrow.unknown' as GeoArrowEncoding
    )
  ).toEqual({valid: true, issues: []});
});

test('native list validation covers missing, short, negative, non-monotonic, and oversized offsets', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Float64(), true)
  );
  const listType = new arrow.List(new arrow.Field('item', coordinateType, true));
  const coordinateChild = {
    type: coordinateType,
    length: 1,
    offset: 0,
    nullCount: 0,
    children: [makeScalarData(new arrow.Float64(), Float64Array.of(1, 2))]
  };

  const cases: [string, Record<string, unknown>][] = [
    ['missing', {valueOffsets: undefined, children: []}],
    ['short', {valueOffsets: new Int32Array(), children: [coordinateChild]}],
    ['negative', {valueOffsets: Float64Array.of(-1, 0), children: [coordinateChild]}],
    ['non-monotonic', {valueOffsets: Int32Array.of(1, 0), children: [coordinateChild]}],
    ['oversized', {valueOffsets: Int32Array.of(0, 2), children: [coordinateChild]}]
  ];
  for (const [name, data] of cases) {
    const result = validateGeoArrowVector(makeDataVector(listType, data), 'geoarrow.linestring');
    expect(result.valid, name).toBe(false);
    expect(result.issues.length, name).toBeGreaterThan(0);
  }

  const unsupportedChild = makeDataVector(listType, {
    valueOffsets: Int32Array.of(0, 1),
    children: [makeScalarData(new arrow.Int32(), Int32Array.of(1))]
  });
  expect(
    validateGeoArrowVector(unsupportedChild, 'geoarrow.linestring').issues[0].message
  ).toContain('Unsupported native Arrow physical type');
});

test('native coordinate validation covers list size, precision, and child length diagnostics', () => {
  const invalidSizeType = new arrow.FixedSizeList(
    1,
    new arrow.Field('item', new arrow.Float64(), true)
  );
  expect(
    validateGeoArrowVector(makeDataVector(invalidSizeType, {children: []}), 'geoarrow.point')
      .issues[0].message
  ).toContain('two to four values');

  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Int32(), true)
  );
  const result = validateGeoArrowVector(
    makeDataVector(coordinateType, {
      length: 2,
      children: [makeScalarData(new arrow.Int32(), Int32Array.of(1), 1)]
    }),
    'geoarrow.point'
  );
  expect(result.issues.map(issue => issue.message)).toEqual([
    'Native coordinates must use a floating-point child.',
    'Native coordinate buffer is shorter than its list.'
  ]);
});

test('native Struct validation covers names, precision, lengths, nulls, and Box extents', () => {
  const malformedType = new arrow.Struct([
    new arrow.Field('longitude', new arrow.Int32(), true),
    new arrow.Field('latitude', new arrow.Int32(), true)
  ]);
  expect(
    validateGeoArrowVector(
      makeDataVector(malformedType, {
        children: [
          makeScalarData(new arrow.Int32(), Int32Array.of(1)),
          makeScalarData(new arrow.Int32(), Int32Array.of(2))
        ]
      }),
      'geoarrow.point'
    ).issues[0].message
  ).toContain('non-canonical');

  const pointType = new arrow.Struct([
    new arrow.Field('x', new arrow.Int32(), true),
    new arrow.Field('y', new arrow.Float64(), true)
  ]);
  const pointResult = validateGeoArrowVector(
    makeDataVector(pointType, {
      length: 2,
      children: [
        makeScalarData(new arrow.Int32(), Int32Array.of(1), 1),
        makeScalarData(new arrow.Float64(), Float64Array.of(2), 1)
      ]
    }),
    'geoarrow.point'
  );
  expect(pointResult.issues.map(issue => issue.message)).toEqual([
    'Native struct children must be floating-point.',
    'Native struct child is shorter than its parent.',
    'Native struct child is shorter than its parent.'
  ]);

  const boxType = new arrow.Struct(
    ['xmin', 'ymin', 'xmax', 'ymax'].map(name => new arrow.Field(name, new arrow.Float64(), true))
  );
  const box = makeDataVector(boxType, {
    length: 3,
    nullCount: 1,
    nullBitmap: Uint8Array.of(0b00000101),
    children: [
      makeScalarData(new arrow.Float64(), Float64Array.of(5, 0, Number.NaN), 3),
      makeScalarData(new arrow.Float64(), Float64Array.of(2, 0, 1), 3),
      makeScalarData(new arrow.Float64(), Float64Array.of(4, 0, 3), 3),
      makeScalarData(new arrow.Float64(), Float64Array.of(6, 0, 4), 3)
    ]
  });
  const boxResult = validateGeoArrowVector(box, 'geoarrow.box');
  expect(boxResult.issues.map(issue => issue.message)).toEqual([
    'GeoArrow Box xmin must not exceed xmax.',
    'GeoArrow Box xmin/xmax values must be finite.'
  ]);
});

test('dense-union validation covers absent buffers, unknown IDs, invalid offsets, and child recursion', () => {
  const pointType = new arrow.FixedSizeList(2, new arrow.Field('item', new arrow.Float64(), true));
  const unionType = new arrow.DenseUnion([1], [new arrow.Field('Point', pointType, true)]);
  const pointChild = {
    type: pointType,
    length: 1,
    offset: 0,
    nullCount: 0,
    children: [makeScalarData(new arrow.Float64(), Float64Array.of(1, 2))]
  };

  const missing = validateGeoArrowVector(
    makeDataVector(unionType, {typeIds: undefined, valueOffsets: undefined}),
    'geoarrow.geometry'
  );
  expect(missing.issues[0].message).toContain('missing type IDs');

  const malformed = validateGeoArrowVector(
    makeDataVector(unionType, {
      length: 3,
      typeIds: Int8Array.of(9, 1, 1),
      valueOffsets: Int32Array.of(0, -1, 2),
      children: [pointChild]
    }),
    'geoarrow.geometry'
  );
  expect(malformed.issues.map(issue => issue.message)).toEqual([
    'Unknown dense union type id 9.',
    'Dense union value offset -1 is outside child 0.',
    'Dense union value offset 2 is outside child 0.'
  ]);

  const unsupportedChild = validateGeoArrowVector(
    makeDataVector(new arrow.DenseUnion([1], [new arrow.Field('Point', new arrow.Int32(), true)]), {
      typeIds: Int8Array.of(1),
      valueOffsets: Int32Array.of(0),
      children: [makeScalarData(new arrow.Int32(), Int32Array.of(1))]
    }),
    'geoarrow.geometry'
  );
  expect(unsupportedChild.issues.some(issue => issue.message.includes('Unsupported native'))).toBe(
    true
  );

  expect(
    validateGeoArrowVector(makeValueVector([], pointType), 'geoarrow.geometrycollection')
  ).toMatchObject({
    valid: false,
    issues: [{path: 'type'}]
  });
});

test('field capabilities and negotiation cover metadata, native selection, conversion, and mismatches', () => {
  const source = convertFeaturesToGeoArrowTable([
    {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2, 3]}}
  ]).data;
  const native = convertGeoArrowGeometry(source, 'geoarrow.point', {
    coordinates: 'separated',
    dimension: 'xyz'
  });
  const nativeField = native.schema.fields[0];
  const info = getGeoArrowFieldInfo(nativeField);
  expect(info).toMatchObject({
    encoding: 'geoarrow.point',
    dimension: 'xyz',
    coordinates: 'separated'
  });
  expect(negotiateGeoArrowEncoding(nativeField)).toBe('geoarrow.point');
  expect(negotiateGeoArrowEncoding(nativeField, {encoding: 'native'})).toBe('geoarrow.point');
  expect(
    negotiateGeoArrowEncoding(nativeField, {encoding: 'geoarrow.wkb', allowConversion: true})
  ).toBe('geoarrow.wkb');
  expect(() => negotiateGeoArrowEncoding(nativeField, {encoding: 'geoarrow.wkb'})).toThrow(
    'without allowing conversion'
  );
  expect(() => negotiateGeoArrowEncoding(nativeField, {coordinates: 'interleaved'})).toThrow(
    'does not use interleaved'
  );
  expect(() => negotiateGeoArrowEncoding(nativeField, {dimension: 'xy'})).toThrow(
    'does not use xy'
  );

  const lines = convertGeoArrowGeometry(
    convertFeaturesToGeoArrowTable([
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1]
          ]
        }
      }
    ]).data,
    'geoarrow.linestring',
    {offsetType: 'int64'}
  );
  const lineField = lines.schema.fields[0];
  expect(getGeoArrowFieldInfo(lineField)?.offsetType).toBe('int64');
  expect(() => negotiateGeoArrowEncoding(lineField, {offsetType: 'int32'})).toThrow(
    'does not use int32 offsets'
  );

  const wkbField = source.schema.fields[0];
  expect(negotiateGeoArrowEncoding(wkbField, {encoding: 'native'})).toBe('native');

  const plainField = new arrow.Field('value', new arrow.Int32(), true);
  expect(getGeoArrowFieldInfo(plainField)).toBeNull();
  expect(validateGeoArrowField(plainField)).toMatchObject({valid: false, info: null});
  expect(() => negotiateGeoArrowEncoding(plainField)).toThrow('not a recognized GeoArrow field');
});

test('field validation reports empty geometry metadata and incompatible physical layouts', () => {
  const emptyGeometryTypes = new arrow.Field(
    'geometry',
    new arrow.Binary(),
    true,
    new Map([
      ['ARROW:extension:name', 'geoarrow.wkb'],
      ['ARROW:extension:metadata', JSON.stringify({geometry_types: []})]
    ])
  );
  expect(
    validateGeoArrowField(emptyGeometryTypes).issues.some(issue =>
      issue.path.endsWith('geometry_types')
    )
  ).toBe(true);

  const incompatible = new arrow.Field(
    'geometry',
    new arrow.Int32(),
    true,
    new Map([['ARROW:extension:name', 'geoarrow.point']])
  );
  const result = validateGeoArrowField(incompatible);
  expect(result.valid).toBe(false);
  expect(result.issues.some(issue => issue.message.includes('physical Arrow layout'))).toBe(true);
});
