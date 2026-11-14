// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as schema from '@loaders.gl/core/schema';

test('schema package keeps mesh helpers in schema-utils', () => {
  expect('getMeshSize' in schema).toBe(false);
  expect('getMeshBoundingBox' in schema).toBe(false);
});
