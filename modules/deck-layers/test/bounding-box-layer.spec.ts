// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {AxisAlignedBoundingBox, OrientedBoundingBox} from '@math.gl/culling';
import {createBoundingBoxLayerEdges} from '../src/bounding-box-utils';
test('createBoundingBoxLayerEdges creates edge paths for AxisAlignedBoundingBox', () => {
  const boundingBox = new AxisAlignedBoundingBox([0, 1, 2], [3, 4, 5]);
  const paths = createBoundingBoxLayerEdges([boundingBox]);
  expect(paths.length, 'creates one path per box edge').toBe(12);
  expect(
    [paths[0].sourcePosition, paths[0].targetPosition],
    'uses the minimum z bottom edge'
  ).toEqual([
    [0, 1, 2],
    [3, 1, 2]
  ]);
  expect([paths[8].sourcePosition, paths[8].targetPosition], 'uses vertical edges').toEqual([
    [0, 1, 2],
    [0, 1, 5]
  ]);
});
test('createBoundingBoxLayerEdges creates edge paths for OrientedBoundingBox', () => {
  const boundingBox = new OrientedBoundingBox([10, 20, 30], [1, 0, 0, 0, 2, 0, 0, 0, 3]);
  const paths = createBoundingBoxLayerEdges([boundingBox]);
  expect(paths.length, 'creates one path per box edge').toBe(12);
  expect(paths[0].sourcePosition, 'uses oriented box negative corner').toEqual([9, 18, 27]);
  expect(paths[0].targetPosition, 'uses oriented box positive x corner').toEqual([11, 18, 27]);
});
