// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {TerrainSurface} from '../../src/terrain/heightmap';

test('a structural surface returns displayed geometry separately from physical height', () => {
  const surface: TerrainSurface = {
    projection: 'web-mercator',
    intersectRay(ray, maxDistance = Infinity) {
      const distance = ((ray.origin[2] - 100) / -ray.direction[2]) * Math.hypot(...ray.direction);
      return distance >= 0 && distance <= maxDistance
        ? {
            position: [0, 0, 100],
            coordinate: [0, 0, 10],
            distance,
            normal: [0, 0, 1],
            triangleIndex: 0,
            barycentric: [1, 0, 0]
          }
        : null;
    }
  };
  const hit = surface.intersectRay({origin: [0, 0, 200], direction: [0, 0, -2]}, 100);
  expect(hit?.position[2]).toBe(100);
  expect(hit?.coordinate[2]).toBe(10);
  expect(hit?.distance).toBe(100);
  expect(surface.intersectRay({origin: [0, 0, 200], direction: [0, 0, -2]}, 99)).toBeNull();
});
