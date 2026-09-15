// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getS2DescendantIndex, getS2IndexFromToken, getS2TokenFromIndex} from '@math.gl/dggs/s2';
import {convertS2BoundingVolumetoOBB} from '../../../src/lib/utils/obb/s2-corners-to-obb';

test('S2 hierarchy addresses convert to runtime oriented bounding boxes', () => {
  const rootIndex = getS2IndexFromToken('3');
  const descendantIndex = getS2DescendantIndex(rootIndex, 3, 2, 5);
  const token = getS2TokenFromIndex(descendantIndex);
  const box = convertS2BoundingVolumetoOBB({
    token,
    minimumHeight: -10,
    maximumHeight: 100
  });

  expect(box).toHaveLength(12);
  expect(box.every(Number.isFinite)).toBe(true);
});

test('S2 volume conversion supports polar and antimeridian cells', () => {
  for (const token of ['5', '54', '5c']) {
    const box = convertS2BoundingVolumetoOBB({
      token,
      minimumHeight: 0,
      maximumHeight: 100
    });
    expect(box, token).toHaveLength(12);
    expect(box.every(Number.isFinite), token).toBe(true);
  }
});

test('S2 volume conversion rejects malformed tokens', () => {
  expect(() =>
    convertS2BoundingVolumetoOBB({token: 'not-s2', minimumHeight: 0, maximumHeight: 1})
  ).toThrow(/Invalid S2 token/);
});
