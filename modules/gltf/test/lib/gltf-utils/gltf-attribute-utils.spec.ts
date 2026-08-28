// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getGLTFAccessors,
  getGLTFAccessor
  // @ts-expect-error
} from '@loaders.gl/gltf/lib/gltf-utils/gltf-attribute-utils';
// Check if an attribute contains indices
test('getGLTFAccessors', () => {
  expect(getGLTFAccessors).toBeTruthy();
  expect(getGLTFAccessor).toBeTruthy();
});
