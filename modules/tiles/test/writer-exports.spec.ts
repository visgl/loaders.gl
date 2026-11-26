// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {MLTWriter} from '@loaders.gl/tiles/mlt';
import {MLTWriter as BundledMLTWriter} from '@loaders.gl/tiles/mlt/bundled';
import {MVTWriter} from '@loaders.gl/tiles/mvt';
import {MVTWriter as BundledMVTWriter} from '@loaders.gl/tiles/mvt/bundled';
import {PMTilesWriter} from '@loaders.gl/tiles/pmtiles';
import {PMTilesWriter as BundledPMTilesWriter} from '@loaders.gl/tiles/pmtiles/bundled';

test.each([
  ['MLTWriter', MLTWriter, BundledMLTWriter],
  ['MVTWriter', MVTWriter, BundledMVTWriter],
  ['PMTilesWriter', PMTilesWriter, BundledPMTilesWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
