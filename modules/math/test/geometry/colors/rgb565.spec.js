// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decodeRGB565, encodeRGB565} from '@loaders.gl/math';

test('encodeRGB565/decodeRGB565', () => {
  const color = [255, 128, 24];
  const rgb565 = encodeRGB565(color);

  expect(rgb565).toBe(0xfc03);
  expect(decodeRGB565(rgb565)).toEqual([248, 128, 24]);
});

test('decodeRGB565 writes into the provided target', () => {
  const target = [0, 0, 0];

  expect(decodeRGB565(0x07e0, target)).toBe(target);
  expect(target).toEqual([0, 252, 0]);
});
