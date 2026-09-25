// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as schema from '@loaders.gl/schema';

test('schema package retains only the deprecated mesh-bounds alias', () => {
  expect('getMeshSize' in schema).toBe(false);
  expect('getMeshBoundingBox' in schema).toBe(true);
});
