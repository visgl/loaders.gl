// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {AxisAlignedBoundingBox, OrientedBoundingBox} from '@math.gl/culling';
import {createBoundingBoxLayerEdges} from '../src/bounding-box-utils';

test('createBoundingBoxLayerEdges creates edge paths for AxisAlignedBoundingBox', t => {
  const boundingBox = new AxisAlignedBoundingBox([0, 1, 2], [3, 4, 5]);
  const paths = createBoundingBoxLayerEdges([boundingBox]);

  t.equal(paths.length, 12, 'creates one path per box edge');
  t.deepEqual(
    [paths[0].sourcePosition, paths[0].targetPosition],
    [
      [0, 1, 2],
      [3, 1, 2]
    ],
    'uses the minimum z bottom edge'
  );
  t.deepEqual(
    [paths[8].sourcePosition, paths[8].targetPosition],
    [
      [0, 1, 2],
      [0, 1, 5]
    ],
    'uses vertical edges'
  );
  t.end();
});

test('createBoundingBoxLayerEdges creates edge paths for OrientedBoundingBox', t => {
  const boundingBox = new OrientedBoundingBox([10, 20, 30], [1, 0, 0, 0, 2, 0, 0, 0, 3]);
  const paths = createBoundingBoxLayerEdges([boundingBox]);

  t.equal(paths.length, 12, 'creates one path per box edge');
  t.deepEqual(paths[0].sourcePosition, [9, 18, 27], 'uses oriented box negative corner');
  t.deepEqual(paths[0].targetPosition, [11, 18, 27], 'uses oriented box positive x corner');
  t.end();
});
