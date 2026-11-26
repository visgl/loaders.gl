// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {CompressedTextureWriter} from '@loaders.gl/images/texture';
import {CompressedTextureWriter as BundledCompressedTextureWriter} from '@loaders.gl/images/texture/bundled';
import {ImageWriter} from '@loaders.gl/images/image';
import {ImageWriter as BundledImageWriter} from '@loaders.gl/images/image/bundled';
import {KTX2BasisWriter} from '@loaders.gl/images/basis';
import {KTX2BasisWriter as BundledKTX2BasisWriter} from '@loaders.gl/images/basis/bundled';

test.each([
  ['CompressedTextureWriter', CompressedTextureWriter, BundledCompressedTextureWriter],
  ['ImageWriter', ImageWriter, BundledImageWriter],
  ['KTX2BasisWriter', KTX2BasisWriter, BundledKTX2BasisWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
