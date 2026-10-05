// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {canReuseRasterCoverage} from '../../../src';
import type {RasterData, RasterRegionParameters} from '../../../src';

test('coverage reuse checks both axes, interpretation, authorization and rotated grids', () => {
  const raster: RasterData = {
    data: new Uint8Array(100),
    width: 10,
    height: 10,
    bandCount: 1,
    dtype: 'uint8',
    crs: 'EPSG:4326',
    boundingBox: [
      [0, 0],
      [10, 10]
    ],
    transform: [1, 0, 0, 0, -1, 10],
    resolution: [1, 1]
  };
  const accepted: RasterRegionParameters = {
    bounds: [
      [0, 0],
      [10, 10]
    ],
    crs: 'EPSG:4326',
    width: 10,
    height: 10,
    bands: [0],
    selection: {time: 0}
  };
  const candidate = {
    ...accepted,
    bounds: [
      [1, 1],
      [9, 9]
    ] as RasterRegionParameters['bounds'],
    width: 8,
    height: 8
  };
  const identity = {source: {}, authorization: {}, revision: '1'};
  expect(canReuseRasterCoverage(raster, accepted, candidate, identity, identity)).toBe(true);
  expect(
    canReuseRasterCoverage(raster, accepted, {...candidate, height: 16}, identity, identity)
  ).toBe(false);
  expect(
    canReuseRasterCoverage(raster, accepted, {...candidate, height: 16}, identity, identity, 2)
  ).toBe(true);
  expect(
    canReuseRasterCoverage(raster, accepted, candidate, identity, {...identity, authorization: {}})
  ).toBe(false);
  expect(
    canReuseRasterCoverage(
      raster,
      accepted,
      {...candidate, selection: {time: 1}},
      identity,
      identity
    )
  ).toBe(false);
  raster.transform![1] = 0.1;
  expect(canReuseRasterCoverage(raster, accepted, candidate, identity, identity)).toBe(false);
});
