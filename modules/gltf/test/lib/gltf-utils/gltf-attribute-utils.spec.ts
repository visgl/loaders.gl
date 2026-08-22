// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getGLTFAccessors,
  getGLTFAccessor
  // @ts-expect-error
} from '@loaders.gl/gltf/lib/gltf-utils/gltf-attribute-utils';

// Check if an attribute contains indices

test('getGLTFAccessors', t => {
  t.ok(getGLTFAccessors);
  t.ok(getGLTFAccessor);
  t.end();
});
