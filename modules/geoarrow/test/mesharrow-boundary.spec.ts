// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getFixedSizeListData,
  getFixedSizeListSize,
  getFixedSizeListType,
  getFixedSizeListVector,
  isFixedSizeList
} from '../src/mesharrow/arrow-fixed-size-list-utils';
import {getBoundingBoxFromArrowPositions} from '../src/mesharrow/get-bounding-box';

test('mesharrow fixed-size-list helpers preserve stride and values', () => {
  const positions = new Float32Array([-5, -4, -3, 2, 7, 1, -1, 3, 9]);
  const type = getFixedSizeListType(positions, 3);
  const data = getFixedSizeListData(positions, 3);
  const vector = getFixedSizeListVector(positions, 3);

  expect(type.listSize).toBe(3);
  expect(data.length).toBe(3);
  expect(isFixedSizeList(vector)).toBe(true);
  expect(getFixedSizeListSize(vector)).toBe(3);
  expect(getFixedSizeListSize(vector.getChildAt(0)!)).toBe(1);
  expect(Array.from(vector.getChildAt(0)!.toArray())).toEqual(Array.from(positions));
});

test('mesharrow bounding boxes inspect every point and support negative maxima', () => {
  const positions = getFixedSizeListVector(
    new Float64Array([-5, -4, -3, -2, -1, -8, -7, -6, -0.5]),
    3
  );

  expect(getBoundingBoxFromArrowPositions(positions)).toEqual([
    [-7, -6, -8],
    [-2, -1, -0.5]
  ]);
});
