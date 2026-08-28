// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {PointCloudTileset} from '@loaders.gl/tiles';
import {expect, test} from 'vitest';

test('PointCloudTileset splits dateline-crossing bounds for projection', () => {
  const tileset = Object.create(PointCloudTileset.prototype) as PointCloudTileset;
  const corners = (tileset as any).getBoundingVolumeCorners({
    cartographicBounds: [
      [179.75, -1, 0],
      [-179.75, 1, 100]
    ],
    wrapsDateline: true,
    center: [180, 0, 50],
    radius: 100
  });

  expect(corners).toHaveLength(16);
  expect(corners.some((corner: number[]) => corner[0] === 180)).toBe(true);
  expect(corners.some((corner: number[]) => corner[0] === -180)).toBe(true);
});
