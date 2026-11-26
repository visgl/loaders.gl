// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {QuantizedMeshWriter} from '@loaders.gl/raster/terrain';
import {QuantizedMeshWriter as BundledQuantizedMeshWriter} from '@loaders.gl/raster/terrain/bundled';

test.each([
  ['QuantizedMeshWriter', QuantizedMeshWriter, BundledQuantizedMeshWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
