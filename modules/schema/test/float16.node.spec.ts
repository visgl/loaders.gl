// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getFloat16Value, setFloat16Value} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

test('Float16 fallback encodes and decodes binary16 words', () => {
  const storage = new Uint16Array(3);
  setFloat16Value(storage, 0, 0);
  setFloat16Value(storage, 1, 0.5);
  setFloat16Value(storage, 2, 1);

  expect(Array.from(storage)).toEqual([0x0000, 0x3800, 0x3c00]);
  expect(getFloat16Value(storage, 1)).toBeCloseTo(0.5, 3);
});
