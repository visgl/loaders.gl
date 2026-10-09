// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {updateBoundsFromGeoArrowSamples} from '@loaders.gl/gis';

test.each([2, 3, 4])('sampled bounds ignore empty points with %i ordinates', numberOfDimensions => {
  const coordinates = [
    [NaN, NaN],
    [1, 2],
    [NaN, NaN],
    [3, 4]
  ];
  const values = Float64Array.from(
    coordinates.flatMap(coordinate => [...coordinate, ...Array(numberOfDimensions - 2).fill(NaN)])
  );
  const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  expect(updateBoundsFromGeoArrowSamples(values, numberOfDimensions, bounds)).toEqual([1, 2, 3, 4]);
  expect(bounds).toEqual([Infinity, Infinity, -Infinity, -Infinity]);
});

test.each([
  new Float64Array(),
  Float64Array.of(NaN, NaN, NaN, NaN)
])('empty samples preserve existing bounds', values => {
  const bounds: [number, number, number, number] = [1, 2, 3, 4];
  const result = updateBoundsFromGeoArrowSamples(values, 2, bounds);
  expect(result).toEqual(bounds);
  expect(result).not.toBe(bounds);
});

test('sampled bounds retain per-axis comparison semantics and sampling limits', () => {
  expect(
    updateBoundsFromGeoArrowSamples(Float64Array.of(NaN, 0, -1, NaN), 2, [1, 2, 3, 4])
  ).toEqual([-1, 0, 3, 4]);
  expect(
    updateBoundsFromGeoArrowSamples(
      Float64Array.of(1, 2, 100, 100, 3, 4, 200, 200),
      2,
      [Infinity, Infinity, -Infinity, -Infinity],
      2
    )
  ).toEqual([1, 2, 3, 4]);
});
