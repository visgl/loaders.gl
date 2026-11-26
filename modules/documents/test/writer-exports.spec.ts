// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BSONWriter} from '@loaders.gl/documents/bson';
import {BSONWriter as BundledBSONWriter} from '@loaders.gl/documents/bson/bundled';

test.each([
  ['BSONWriter', BSONWriter, BundledBSONWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
