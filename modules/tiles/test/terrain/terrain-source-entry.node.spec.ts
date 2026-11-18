// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

test('terrain source subpath has ESM and CommonJS exports', async () => {
  const esm = await import('@loaders.gl/tiles/terrain');
  const commonjs = createRequire(import.meta.url)('@loaders.gl/tiles/terrain');
  expect(esm.TerrainSource).toBeTypeOf('function');
  expect(commonjs.TerrainSource).toBeTypeOf('function');
});
