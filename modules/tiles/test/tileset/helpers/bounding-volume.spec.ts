// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {createBoundingVolume} from '../../../src/tileset-3d/helpers/bounding-volume';
import {degrees, Matrix4} from '@math.gl/core';
import {OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
test('Tiles bounding-volume#createBoundingVolume - bounds Cesium OSM region', () => {
  // Root region reported by Cesium OSM Buildings in loaders.gl issue #3144.
  const region = [
    -3.1415925942485985, -1.4599681618940228, 3.141545370875028, 1.4502639200680947,
    -385.0565011513918, 5967.300616082603
  ];
  const result = createBoundingVolume({region}, new Matrix4());
  expect(result).toBeInstanceOf(OrientedBoundingBox);
  expect(result.center.every(Number.isFinite)).toBe(true);
  expect(result.halfAxes.every(Number.isFinite)).toBe(true);
  const [, south, , north, minimumHeight, maximumHeight] = region;
  for (const longitude of [-180, -90, 0, 90, 179]) {
    for (const latitude of [degrees(south), 0, degrees(north)]) {
      for (const height of [minimumHeight, maximumHeight]) {
        const point = Ellipsoid.WGS84.cartographicToCartesian([longitude, latitude, height]);
        expect(result.distanceTo(point)).toBeLessThan(1e-5);
      }
    }
  }
});

test('Tiles bounding-volume#createBoundingVolume - keeps S2 ECEF boxes transform independent', () => {
  const box = [1, 2, 3, 4, 0, 0, 0, 5, 0, 0, 0, 6];
  const transform = new Matrix4().translate([100, 200, 300]);

  const s2BoundingVolume = createBoundingVolume(
    {box, s2VolumeInfo: {token: '1', minimumHeight: 0, maximumHeight: 10}},
    transform
  );
  const localBoundingVolume = createBoundingVolume({box}, transform);

  expect(s2BoundingVolume.center).toEqual([1, 2, 3]);
  expect(localBoundingVolume.center).toEqual([101, 202, 303]);
});
