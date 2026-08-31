// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertI3SObbToMbs} from '../src/lib/utils/convert-i3s-obb-to-mbs';

test('convertI3SObbToMbs preserves the cartographic center and encloses every half axis', () => {
  const center = [-122.4, 37.8, 25];
  const sphere = convertI3SObbToMbs({center, halfSize: [3, 4, 12]});
  expect(sphere.slice(0, 3)).toEqual(center);
  expect(sphere[3]).toBeCloseTo(13);
});
