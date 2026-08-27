// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BoundingSphere, CullingVolume, INTERSECTION, Plane} from '@math.gl/culling';
import {Vector3} from '@math.gl/core';
import {getContentVisibility} from '../../src/tileset-3d/common/tile-3d';

function createCullingVolume(visibleCenters: Set<number>) {
  return {
    computeVisibility: (volume: BoundingSphere) =>
      visibleCenters.has(volume.center[0]) ? INTERSECTION.INSIDE : INTERSECTION.OUTSIDE
  } as unknown as CullingVolume;
}

test('getContentVisibility treats multiple content volumes as a visible union', () => {
  const firstVolume = new BoundingSphere([-10, 0, 0], 1);
  const secondVolume = new BoundingSphere([10, 0, 0], 1);
  const cullingVolume = createCullingVolume(new Set([10]));

  expect(
    getContentVisibility(
      [firstVolume, secondVolume],
      firstVolume,
      cullingVolume,
      CullingVolume.MASK_OUTSIDE
    )
  ).toBe(INTERSECTION.INSIDE);
});

test('getContentVisibility applies clipping planes to content without pruning traversal', () => {
  const contentVolume = new BoundingSphere([0, 0, 0], 1);
  const cullingVolume = createCullingVolume(new Set([0]));
  const clippingPlane = new Plane(new Vector3([1, 0, 0]), -2);

  expect(
    getContentVisibility(
      [contentVolume],
      contentVolume,
      cullingVolume,
      CullingVolume.MASK_OUTSIDE,
      [clippingPlane]
    )
  ).toBe(INTERSECTION.OUTSIDE);
});

test('getContentVisibility falls back to the tile volume for contentless tiles', () => {
  const tileVolume = new BoundingSphere([0, 0, 0], 1);
  const cullingVolume = createCullingVolume(new Set([0]));

  expect(
    getContentVisibility([], tileVolume, cullingVolume, CullingVolume.MASK_OUTSIDE)
  ).toBe(INTERSECTION.INSIDE);
});
