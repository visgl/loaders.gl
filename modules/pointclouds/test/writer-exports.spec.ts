// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {LASWriter} from '@loaders.gl/pointclouds/las';
import {LASWriter as BundledLASWriter} from '@loaders.gl/pointclouds/las/bundled';
import {PCDWriter} from '@loaders.gl/pointclouds/pcd';
import {PCDWriter as BundledPCDWriter} from '@loaders.gl/pointclouds/pcd/bundled';
import {PLYWriter} from '@loaders.gl/pointclouds/ply';
import {PLYWriter as BundledPLYWriter} from '@loaders.gl/pointclouds/ply/bundled';

test.each([
  ['LASWriter', LASWriter, BundledLASWriter],
  ['PCDWriter', PCDWriter, BundledPCDWriter],
  ['PLYWriter', PLYWriter, BundledPLYWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
