// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Tiles3DArchiveWriter, Tile3DWriter} from '@loaders.gl/tiles-3d/3d-tiles';
import {
  Tiles3DArchiveWriter as BundledTiles3DArchiveWriter,
  Tile3DWriter as BundledTile3DWriter
} from '@loaders.gl/tiles-3d/3d-tiles/bundled';
import {COPCWriter} from '@loaders.gl/tiles-3d/copc';
import {COPCWriter as BundledCOPCWriter} from '@loaders.gl/tiles-3d/copc/bundled';
import {SLPKWriter} from '@loaders.gl/tiles-3d/i3s';
import {SLPKWriter as BundledSLPKWriter} from '@loaders.gl/tiles-3d/i3s/bundled';
import {PotreeWriter} from '@loaders.gl/tiles-3d/potree';
import {PotreeWriter as BundledPotreeWriter} from '@loaders.gl/tiles-3d/potree/bundled';

test.each([
  ['Tiles3DArchiveWriter', Tiles3DArchiveWriter, BundledTiles3DArchiveWriter],
  ['Tile3DWriter', Tile3DWriter, BundledTile3DWriter],
  ['COPCWriter', COPCWriter, BundledCOPCWriter],
  ['SLPKWriter', SLPKWriter, BundledSLPKWriter],
  ['PotreeWriter', PotreeWriter, BundledPotreeWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
