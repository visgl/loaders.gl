// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {BinaryPolygonGeometry} from '@loaders.gl/schema';
import {getGeoArrowRowBounds, makeGeoArrowColumnFromBinaryPolygon} from '@loaders.gl/geoarrow';
import {
  getGeoArrowBounds,
  getGeoArrowRowCount,
  validateGeoArrowColumn,
  visitGeoArrowCoordinates
} from '@math.gl/geoarrow';
import type {GeoArrowDimension, GeoArrowList} from '@math.gl/geoarrow';
import {makeArrowVectorFromGeoArrowColumn} from '../src/lib/arrow-geoarrow-adapter';

/** Two polygons: a square with a triangular hole, followed by a triangle. */
function makePolygons(): BinaryPolygonGeometry {
  return {
    type: 'Polygon',
    positions: {
      value: new Float64Array([
        0, 0, 4, 0, 4, 4, 0, 4, 0, 0, 1, 1, 1, 2, 2, 1, 1, 1, 10, 10, 12, 10, 10, 12, 10, 10
      ]),
      size: 2
    },
    polygonIndices: {value: new Uint32Array([0, 9, 13]), size: 1},
    primitivePolygonIndices: {value: new Int32Array([0, 5, 9, 13]), size: 1},
    triangles: {value: new Uint32Array([9, 10, 11]), size: 1}
  };
}

test('binary polygons share coordinates and ring offsets while converting polygon offsets', () => {
  const geometry = makePolygons();
  const original = structuredClone(geometry);
  const column = makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xy'});
  const polygons = column.chunks[0] as GeoArrowList;
  const rings = polygons.child as GeoArrowList;

  expect(column.encoding).toBe('geoarrow.polygon');
  expect(column.coordinateLayout).toBe('interleaved');
  expect(polygons.offsets).toEqual(new Int32Array([0, 2, 3]));
  expect(rings.offsets).toBe(geometry.primitivePolygonIndices.value);
  expect(rings.child).toMatchObject({
    kind: 'fixed-size-list',
    length: 13,
    size: 2,
    child: {kind: 'primitive', length: 26, values: geometry.positions.value}
  });
  if (rings.child.kind !== 'fixed-size-list' || rings.child.child.kind !== 'primitive') {
    throw new Error('Expected interleaved coordinates.');
  }
  expect(rings.child.child.values).toBe(geometry.positions.value);
  expect(validateGeoArrowColumn(column).valid).toBe(true);
  expect(getGeoArrowBounds(column)).toEqual([0, 0, 12, 12]);
  expect(geometry).toEqual(original);
  expect(column).not.toHaveProperty('triangles');

  // Existing Arrow consumers see the same holes and per-polygon row boundaries.
  const vector = makeArrowVectorFromGeoArrowColumn(column);
  expect(vector.get(0).length).toBe(2);
  expect(vector.get(1).length).toBe(1);
  expect(getGeoArrowRowBounds(vector, 'geoarrow.polygon')).toEqual([
    [0, 0, 4, 4],
    [10, 10, 12, 12]
  ]);
});

test.each([
  Float32Array,
  Float64Array
])('borrows %s coordinate subarrays without rebasing copies', coordinateArrayConstructor => {
  const geometry = makePolygons();
  const backing = new coordinateArrayConstructor(geometry.positions.value.length + 4);
  backing.set(geometry.positions.value, 2);
  geometry.positions.value = backing.subarray(2, backing.length - 2);
  const ringBacking = new Int32Array([99, 0, 5, 9, 13, 99]);
  geometry.primitivePolygonIndices.value = ringBacking.subarray(1, 5);
  const column = makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xy'});
  const rings = (column.chunks[0] as GeoArrowList).child as GeoArrowList;
  expect(rings.offsets).toBe(geometry.primitivePolygonIndices.value);
  if (rings.child.kind !== 'fixed-size-list' || rings.child.child.kind !== 'primitive') {
    throw new Error('Expected interleaved coordinates.');
  }
  expect(rings.child.child.values).toBe(geometry.positions.value);
  expect(getGeoArrowBounds(column)).toEqual([0, 0, 12, 12]);
});

test.each([
  Uint16Array,
  Uint32Array
])('converts %s ring offsets to Int32', offsetArrayConstructor => {
  const geometry = makePolygons();
  geometry.primitivePolygonIndices.value = new offsetArrayConstructor([0, 5, 9, 13]);
  const column = makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xy'});
  const rings = (column.chunks[0] as GeoArrowList).child as GeoArrowList;
  expect(rings.offsets).toEqual(new Int32Array([0, 5, 9, 13]));
  expect(rings.offsets.buffer).not.toBe(geometry.primitivePolygonIndices.value.buffer);
});

test.each<GeoArrowDimension>([
  'xyz',
  'xym',
  'xyzm'
])('preserves explicit %s semantics', dimension => {
  const geometry = makePolygons();
  const size = dimension === 'xyzm' ? 4 : 3;
  const coordinates = Array.from({length: 13}, (_, index) => [
    geometry.positions.value[index * 2],
    geometry.positions.value[index * 2 + 1],
    ...(size === 4 ? [7, 42] : [42])
  ]);
  geometry.positions = {value: new Float64Array(coordinates.flat()), size};
  const column = makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension});
  const visited: number[][] = [];
  visitGeoArrowCoordinates(column, coordinate => {
    visited.push([...coordinate]);
    return coordinate;
  });
  expect(column.dimension).toBe(dimension);
  expect(visited).toEqual(coordinates);
});

test('binary row bounds preserve leading, interior, and trailing empty polygons', () => {
  const geometry = makePolygons();
  geometry.polygonIndices.value = new Uint32Array([0, 0, 9, 9, 13, 13]);
  expect(getGeoArrowRowBounds(geometry, {dimension: 'xy'})).toEqual([
    null,
    [0, 0, 4, 4],
    null,
    [10, 10, 12, 12],
    null
  ]);
});

test.each([0, 1, 3])('preserves %i empty polygon rows without inventing rings', rowCount => {
  const geometry: BinaryPolygonGeometry = {
    type: 'Polygon',
    positions: {value: new Float64Array(0), size: 2},
    polygonIndices: {value: new Int32Array(rowCount + 1), size: 1},
    primitivePolygonIndices: {value: new Int32Array([0]), size: 1}
  };
  const column = makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xy'});
  expect(getGeoArrowRowCount(column)).toBe(rowCount);
  expect(getGeoArrowBounds(column)).toBeNull();
  expect(getGeoArrowRowBounds(geometry, {dimension: 'xy'})).toEqual(Array(rowCount).fill(null));
});

test.each([
  ['missing terminal offset', 'polygonIndices', new Int32Array([0, 9])],
  ['nonzero start', 'polygonIndices', new Int32Array([5, 13])],
  ['split ring', 'polygonIndices', new Int32Array([0, 6, 13])],
  ['decreasing offsets', 'polygonIndices', new Int32Array([0, 9, 5, 13])],
  ['fractional offsets', 'polygonIndices', new Float64Array([0, 5.5, 13])],
  ['NaN offsets', 'polygonIndices', new Float64Array([0, NaN, 13])],
  ['negative offsets', 'polygonIndices', new Int32Array([0, -1, 13])],
  ['overflowing offsets', 'primitivePolygonIndices', new Uint32Array([0, 0xffffffff, 13])],
  ['empty rings', 'primitivePolygonIndices', new Int32Array([0, 5, 5, 9, 13])],
  ['missing offsets', 'primitivePolygonIndices', new Int32Array(0)]
] as const)('rejects %s', (_description, field, offsets) => {
  const geometry = makePolygons();
  geometry[field].value = offsets;
  expect(() => makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xy'})).toThrow();
});

test('rejects mismatched dimensions, incomplete tuples, integer positions, and non-scalar offsets', () => {
  const geometry = makePolygons();
  expect(() => makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xyz'})).toThrow(
    'dimension'
  );
  expect(() =>
    makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'invalid' as GeoArrowDimension})
  ).toThrow('dimension');
  geometry.positions.value = geometry.positions.value.subarray(1);
  expect(() => makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xy'})).toThrow('tuples');
  geometry.positions.value = new Int32Array(26);
  expect(() => makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xy'})).toThrow(
    'floating-point'
  );
  geometry.positions.value = new Float64Array(26);
  geometry.polygonIndices.size = 2;
  expect(() => makeGeoArrowColumnFromBinaryPolygon(geometry, {dimension: 'xy'})).toThrow('size 1');
});
