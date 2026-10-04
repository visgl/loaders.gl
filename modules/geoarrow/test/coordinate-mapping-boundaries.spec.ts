// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {mapGeoArrowCoordinates} from '../src/map-geoarrow-coordinates';

test('coordinate mapping respects sliced separated XYZM buffers', () => {
  const coordinateType = new arrow.Struct(
    ['x', 'y', 'z', 'm'].map(name => new arrow.Field(name, new arrow.Float64()))
  );
  const vector = arrow.vectorFromArray(
    [
      {x: 1, y: 2, z: 3, m: 4},
      {x: 5, y: 6, z: 7, m: 8},
      {x: 9, y: 10, z: 11, m: 12}
    ],
    coordinateType
  );
  const slice = vector.slice(1, 2);
  expect(mapGeoArrowCoordinates(slice, coordinate => coordinate.map(value => value * 2))).toBe(
    slice
  );
  expect(vector.get(0).toJSON()).toEqual({x: 1, y: 2, z: 3, m: 4});
  expect(vector.get(1).toJSON()).toEqual({x: 10, y: 12, z: 14, m: 16});
  expect(vector.get(2).toJSON()).toEqual({x: 9, y: 10, z: 11, m: 12});
});

test('coordinate mapping skips nullable lists and traverses non-coordinate structs', () => {
  const pointType = new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()));
  const listType = new arrow.List(new arrow.Field('point', pointType));
  const type = new arrow.Struct([new arrow.Field('geometry', listType)]);
  const vector = arrow.vectorFromArray(
    [
      {
        geometry: [
          [1, 2],
          [3, 4]
        ]
      },
      {geometry: null},
      {geometry: [[5, 6]]}
    ],
    type
  );
  const mapper = vi.fn(([x, y]) => [x + 10, y + 20]);
  mapGeoArrowCoordinates(vector, mapper);
  expect(mapper).toHaveBeenCalledTimes(3);
  expect(vector.get(1).geometry).toBeNull();
  expect(vector.get(0).geometry.get(1).toArray()).toEqual(new Float64Array([13, 24]));
  expect(vector.get(2).geometry.get(0).toArray()).toEqual(new Float64Array([15, 26]));
});

test('coordinate mapping merges repeated and disjoint union ranges without double transforms', () => {
  const pointType = new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()));
  const points = arrow.vectorFromArray(
    [
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8]
    ],
    pointType
  );
  const type = new arrow.DenseUnion([1], [new arrow.Field('Point', pointType)]);
  const data = arrow.makeData({
    type,
    length: 4,
    typeIds: new Int8Array([1, 1, 1, 1]),
    valueOffsets: new Int32Array([0, 0, 1, 3]),
    children: [points.data[0]]
  });
  const vector = new arrow.Vector([data]);
  const mapper = vi.fn(([x, y]) => [x + 1, y + 1]);
  mapGeoArrowCoordinates(vector, mapper);
  expect(mapper).toHaveBeenCalledTimes(3);
  expect(points.get(0).toArray()).toEqual(new Float64Array([2, 3]));
  expect(points.get(1).toArray()).toEqual(new Float64Array([4, 5]));
  expect(points.get(2).toArray()).toEqual(new Float64Array([5, 6]));
  expect(points.get(3).toArray()).toEqual(new Float64Array([8, 9]));
});

test('coordinate mapping rejects dimension-changing callbacks before writing coordinates', () => {
  const type = new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()));
  const vector = arrow.vectorFromArray([[1, 2]], type);
  expect(() => mapGeoArrowCoordinates(vector, () => [1, 2, 3])).toThrow(
    '3 values for a 2-value coordinate'
  );
  expect(vector.get(0).toArray()).toEqual(new Float64Array([1, 2]));
});
