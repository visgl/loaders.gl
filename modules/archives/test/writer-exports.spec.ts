// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {TarWriter} from '@loaders.gl/archives/tar';
import {TarWriter as BundledTarWriter} from '@loaders.gl/archives/tar/bundled';
import {ZipWriter} from '@loaders.gl/archives/zip';
import {ZipWriter as BundledZipWriter} from '@loaders.gl/archives/zip/bundled';

test.each([
  ['TarWriter', TarWriter, BundledTarWriter],
  ['ZipWriter', ZipWriter, BundledZipWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
