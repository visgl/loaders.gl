// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  inferGeoArrowCoordinateLayoutFromArrowType,
  inferGeoArrowDimensionFromArrowType,
  inferGeoArrowEncodingFromArrowType,
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector
} from '../src/lib/arrow-geoarrow-adapter';

/** Creates a coordinate field with an optional semantic dimension child name. */
function makeCoordinateType(size: number, childName = 'item'): arrow.FixedSizeList {
  return new arrow.FixedSizeList(size, new arrow.Field(childName, new arrow.Float64(), true));
}

/** Wraps one type in the requested number of variable-length list levels. */
function nestListType(type: arrow.DataType, depth: number, large = false): arrow.DataType {
  let nestedType = type;
  for (let index = 0; index < depth; index++) {
    const field = new arrow.Field('item', nestedType, true);
    nestedType = large ? new arrow.LargeList(field) : new arrow.List(field);
  }
  return nestedType;
}

/** Converts Arrow row wrappers and typed arrays into stable assertion values. */
function normalizeArrowValue(value: any): unknown {
  if (value == null) return value;
  if (typeof value.toJSON === 'function') return normalizeArrowValue(value.toJSON());
  if (ArrayBuffer.isView(value)) return Array.from(value as ArrayLike<unknown>);
  if (Array.isArray(value)) return value.map(normalizeArrowValue);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, normalizeArrowValue(child)])
    );
  }
  return value;
}

test('Arrow adapter infers every serialized, union, and native encoding family', () => {
  const serializedCases: [arrow.DataType, string][] = [
    [new arrow.Binary(), 'geoarrow.wkb'],
    [new arrow.LargeBinary(), 'geoarrow.wkb'],
    [new arrow.BinaryView(), 'geoarrow.wkb'],
    [new arrow.Utf8(), 'geoarrow.wkt'],
    [new arrow.LargeUtf8(), 'geoarrow.wkt'],
    [new arrow.Utf8View(), 'geoarrow.wkt']
  ];
  for (const [type, encoding] of serializedCases) {
    expect(inferGeoArrowEncodingFromArrowType(type)).toBe(encoding);
  }

  const coordinate = makeCoordinateType(2);
  expect(inferGeoArrowEncodingFromArrowType(coordinate)).toBe('geoarrow.point');
  expect(inferGeoArrowEncodingFromArrowType(nestListType(coordinate, 1))).toBe(
    'geoarrow.linestring'
  );
  expect(inferGeoArrowEncodingFromArrowType(nestListType(coordinate, 2, true))).toBe(
    'geoarrow.polygon'
  );
  expect(inferGeoArrowEncodingFromArrowType(nestListType(coordinate, 3))).toBe(
    'geoarrow.multipolygon'
  );
  const union = new arrow.DenseUnion([1], [new arrow.Field('Point', coordinate, true)]);
  expect(inferGeoArrowEncodingFromArrowType(union)).toBe('geoarrow.geometry');
  expect(() => inferGeoArrowEncodingFromArrowType(nestListType(coordinate, 4))).toThrow(
    'Cannot infer GeoArrow encoding'
  );
  expect(() => inferGeoArrowEncodingFromArrowType(new arrow.Int32())).toThrow(
    'does not terminate in coordinates'
  );
});

test('Arrow adapter infers dimensions from child names, widths, nesting, and mixed unions', () => {
  expect(inferGeoArrowDimensionFromArrowType(makeCoordinateType(2, 'xy'))).toBe('xy');
  expect(inferGeoArrowDimensionFromArrowType(makeCoordinateType(3, 'xyz'))).toBe('xyz');
  expect(inferGeoArrowDimensionFromArrowType(makeCoordinateType(3, 'xym'))).toBe('xym');
  expect(inferGeoArrowDimensionFromArrowType(makeCoordinateType(4, 'xyzm'))).toBe('xyzm');
  expect(inferGeoArrowDimensionFromArrowType(makeCoordinateType(3))).toBe('xyz');
  expect(inferGeoArrowDimensionFromArrowType(makeCoordinateType(4))).toBe('xyzm');
  expect(() => inferGeoArrowDimensionFromArrowType(makeCoordinateType(5))).toThrow(
    'require 2, 3, or 4 values'
  );

  const separatedCases: [string[], string][] = [
    [['x', 'y'], 'xy'],
    [['x', 'y', 'z'], 'xyz'],
    [['x', 'y', 'm'], 'xym'],
    [['x', 'y', 'z', 'm'], 'xyzm']
  ];
  for (const [names, dimension] of separatedCases) {
    const type = new arrow.Struct(
      names.map(name => new arrow.Field(name, new arrow.Float64(), true))
    );
    expect(inferGeoArrowDimensionFromArrowType(type)).toBe(dimension);
    expect(inferGeoArrowCoordinateLayoutFromArrowType(type)).toBe('separated');
  }

  expect(inferGeoArrowDimensionFromArrowType(nestListType(makeCoordinateType(2), 2))).toBe('xy');
  const mixedUnion = new arrow.DenseUnion(
    [1, 12, 23, 34],
    [
      new arrow.Field('Point', makeCoordinateType(2), true),
      new arrow.Field('LineString Z', nestListType(makeCoordinateType(3), 1), true),
      new arrow.Field('Polygon M', nestListType(makeCoordinateType(3, 'xym'), 2), true),
      new arrow.Field('MultiPoint ZM', nestListType(makeCoordinateType(4), 1), true)
    ]
  );
  expect(inferGeoArrowDimensionFromArrowType(mixedUnion)).toBe('xyzm');
  expect(inferGeoArrowCoordinateLayoutFromArrowType(mixedUnion)).toBe('interleaved');
  expect(inferGeoArrowCoordinateLayoutFromArrowType(new arrow.Int32())).toBeNull();
  expect(() => inferGeoArrowDimensionFromArrowType(new arrow.Int32())).toThrow(
    'Cannot infer GeoArrow dimension'
  );
});

test('Arrow adapter round-trips sliced native, serialized, nullable, and large-offset vectors', () => {
  const coordinate = makeCoordinateType(2);
  const vectors = [
    arrow.vectorFromArray([[1, 2], null, [3, 4]], coordinate).slice(1, 3),
    arrow.vectorFromArray([Uint8Array.of(1, 2), null], new arrow.Binary()),
    arrow.vectorFromArray([Uint8Array.of(3, 4), null], new arrow.LargeBinary()),
    arrow.vectorFromArray(['a', null, 'bc'], new arrow.Utf8()),
    arrow.vectorFromArray(['large', null], new arrow.LargeUtf8()),
    arrow
      .vectorFromArray(
        [
          [
            [1, 2],
            [3, 4]
          ],
          null,
          [[5, 6]]
        ],
        nestListType(coordinate, 1) as arrow.List
      )
      .slice(1, 3)
  ];

  for (const vector of vectors) {
    const column = makeGeoArrowColumnFromArrowVector(vector);
    const roundTrip = makeArrowVectorFromGeoArrowColumn(column);
    expect(roundTrip.length).toBe(vector.length);
    expect(roundTrip.type.toString()).toBe(vector.type.toString());
    expect(
      Array.from({length: vector.length}, (_, index) => normalizeArrowValue(roundTrip.get(index)))
    ).toEqual(
      Array.from({length: vector.length}, (_, index) => normalizeArrowValue(vector.get(index)))
    );
  }
});

test('Arrow adapter emits every primitive Arrow type and packs strided values', () => {
  const arrays = [
    new Int8Array([1]),
    new Uint8Array([1]),
    new Uint8ClampedArray([1]),
    new Int16Array([1]),
    new Uint16Array([1]),
    new Int32Array([1]),
    new Uint32Array([1]),
    new BigInt64Array([1n]),
    new BigUint64Array([1n]),
    new Float32Array([1]),
    new Float64Array([1])
  ];
  for (const values of arrays) {
    const vector = makeArrowVectorFromGeoArrowColumn({
      encoding: 'geoarrow.point',
      dimension: 'xy',
      coordinateLayout: 'interleaved',
      chunks: [{kind: 'primitive', length: 1, values}]
    } as any);
    expect(vector.length).toBe(1);
  }

  const strided = makeArrowVectorFromGeoArrowColumn({
    encoding: 'geoarrow.point',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'primitive',
        length: 2,
        values: Float64Array.of(0, 10, 1, 20, 2),
        offset: 1,
        stride: 2
      }
    ]
  } as any);
  expect(Array.from(strided.toArray())).toEqual([10, 20]);

  const unsupportedValues = {
    0: 1,
    length: 1,
    constructor: {name: 'UnsupportedNumericArray'},
    subarray() {
      return this;
    }
  };
  expect(() =>
    makeArrowVectorFromGeoArrowColumn({
      encoding: 'geoarrow.point',
      dimension: 'xy',
      coordinateLayout: 'interleaved',
      chunks: [{kind: 'primitive', length: 1, values: unsupportedValues}]
    } as any)
  ).toThrow('Unsupported GeoArrow primitive values');
});

test('Arrow adapter normalizes offsets, sliced children, Struct children, and validity bitmaps', () => {
  const primitive = {kind: 'primitive', length: 6, values: Float64Array.of(0, 1, 2, 3, 4, 5)};
  const fixed = makeArrowVectorFromGeoArrowColumn({
    encoding: 'geoarrow.point',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'fixed-size-list',
        length: 2,
        size: 2,
        offset: 1,
        child: primitive,
        validity: {values: Uint8Array.of(0b00000100), bitOffset: 1}
      }
    ]
  } as any);
  expect(fixed.length).toBe(2);
  expect(fixed.nullCount).toBe(1);

  const list = makeArrowVectorFromGeoArrowColumn({
    encoding: 'geoarrow.linestring',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'list',
        length: 1,
        offsets: Int32Array.of(2, 4),
        offsetBase: 2,
        child: {
          kind: 'fixed-size-list',
          length: 2,
          size: 2,
          child: {kind: 'primitive', length: 4, values: Float64Array.of(1, 2, 3, 4)}
        }
      }
    ]
  } as any);
  expect(list.type).toBeInstanceOf(arrow.List);
  expect(list.get(0)?.length).toBe(2);

  const largeList = makeArrowVectorFromGeoArrowColumn({
    encoding: 'geoarrow.linestring',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'list',
        length: 1,
        offsets: BigInt64Array.of(5n, 6n),
        offsetBase: 5n,
        child: {
          kind: 'fixed-size-list',
          length: 1,
          size: 2,
          child: {kind: 'primitive', length: 2, values: Float64Array.of(7, 8)}
        }
      }
    ]
  } as any);
  expect(largeList.type).toBeInstanceOf(arrow.LargeList);

  const struct = makeArrowVectorFromGeoArrowColumn({
    encoding: 'geoarrow.point',
    dimension: 'xy',
    coordinateLayout: 'separated',
    chunks: [
      {
        kind: 'struct',
        length: 1,
        offset: 1,
        children: {
          x: {kind: 'primitive', length: 2, values: Float64Array.of(1, 9)},
          y: {kind: 'primitive', length: 2, values: Float64Array.of(2, 8)}
        }
      }
    ]
  } as any);
  expect(struct.get(0)?.x).toBe(9);
  expect(struct.get(0)?.y).toBe(8);
});

test('Arrow adapter validates dense-union null carriers and dimension suffixes', () => {
  const validUnion = makeArrowVectorFromGeoArrowColumn({
    encoding: 'geoarrow.geometry',
    dimension: 'xyz',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'dense-union',
        length: 1,
        typeIds: Uint8Array.of(1),
        valueOffsets: Int32Array.of(0),
        children: [
          {
            name: 'Point',
            typeId: 1,
            dimension: 'xyz',
            data: {
              kind: 'fixed-size-list',
              length: 1,
              size: 3,
              child: {kind: 'primitive', length: 3, values: Float64Array.of(1, 2, 3)}
            }
          }
        ]
      }
    ]
  } as any);
  expect(validUnion.type).toBeInstanceOf(arrow.DenseUnion);
  expect((validUnion.type as arrow.DenseUnion).children[0].name).toBe('Point Z');

  const malformedNullCases = [
    {typeIds: Uint8Array.of(9), valueOffsets: Int32Array.of(0)},
    {typeIds: Uint8Array.of(1), valueOffsets: Int32Array.of(-1)},
    {typeIds: Uint8Array.of(1), valueOffsets: Int32Array.of(1)},
    {typeIds: Uint8Array.of(1), valueOffsets: Int32Array.of(0), childValidity: undefined},
    {typeIds: Uint8Array.of(1), valueOffsets: Int32Array.of(0), childValidity: Uint8Array.of(1)}
  ];
  for (const malformed of malformedNullCases) {
    expect(() =>
      makeArrowVectorFromGeoArrowColumn({
        encoding: 'geoarrow.geometry',
        dimension: 'xy',
        coordinateLayout: 'interleaved',
        chunks: [
          {
            kind: 'dense-union',
            length: 1,
            validity: {values: Uint8Array.of(0)},
            typeIds: malformed.typeIds,
            valueOffsets: malformed.valueOffsets,
            children: [
              {
                name: 'Point',
                typeId: 1,
                data: {
                  kind: 'fixed-size-list',
                  length: 1,
                  size: 2,
                  validity: malformed.childValidity ? {values: malformed.childValidity} : undefined,
                  child: {kind: 'primitive', length: 2, values: Float64Array.of(1, 2)}
                }
              }
            ]
          }
        ]
      } as any)
    ).toThrow('dense-union null');
  }
});
