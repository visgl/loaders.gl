// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {asyncDeepMap} from '../../src/lib/texture-api/async-deep-map';
const INPUT = {
  a: [1, 2, 3],
  b: 4
};
const OUTPUT = {
  a: [2, 4, 6],
  b: 8
};
test('asyncDeepMap#map', async () => {
  // @ts-expect-error
  expect(await asyncDeepMap(INPUT, async n => Promise.resolve(2 * n))).toEqual(OUTPUT);
});
