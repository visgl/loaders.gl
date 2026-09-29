// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as schema from '@loaders.gl/schema';

test('schema package retains only the deprecated mesh-bounds alias', () => {
  expect('getMeshSize' in schema).toBe(false);
  expect('getMeshBoundingBox' in schema).toBe(true);
});

test('deprecated mesh bounds export preserves extrema across vertices', () => {
  expect(
    schema.getMeshBoundingBox({
      POSITION: {value: new Float32Array([2, -3, 4, -5, 6, -7, 1, 0, 2]), size: 3}
    })
  ).toEqual([
    [-5, -3, -7],
    [2, 6, 4]
  ]);
});

test.each([
  ['missing positions', {}],
  ['empty positions', {POSITION: {value: new Float32Array(), size: 3}}],
  // Legacy JavaScript consumers may supply an accessor before its data is populated.
  ['unpopulated positions', {POSITION: {value: null, size: 3}}]
])('deprecated mesh bounds export handles %s', (_name, attributes) => {
  expect(schema.getMeshBoundingBox(attributes as schema.MeshAttributes)).toEqual([
    [Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, -Infinity]
  ]);
});
