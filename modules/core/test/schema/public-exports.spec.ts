// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as schema from '@loaders.gl/core/schema';
import {getMeshBoundingBox} from '@loaders.gl/core/schema-utils';

test('schema exposes the mesh bounds compatibility export for deck.gl', () => {
  expect('getMeshSize' in schema).toBe(false);
  expect(schema.getMeshBoundingBox).toBe(getMeshBoundingBox);
});
