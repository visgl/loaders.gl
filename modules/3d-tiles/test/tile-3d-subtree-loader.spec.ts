// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {Tile3DSubtreeLoader} from '@loaders.gl/3d-tiles';

const FULL_SUBTREE_FILE_URL = '@loaders.gl/3d-tiles/test/data/FullQuadtree/subtrees/0/0/0.subtree';
const INTERNAL_BINARY_SUBTREE_FILE_URL =
  '@loaders.gl/3d-tiles/test/data/BasicExample/subtrees/0/0/0.subtree';
const INTERNAL_BINARY_SPARSE_SUBTREE_FILE_URL =
  '@loaders.gl/3d-tiles/test/data/SparseOctree/subtrees/0/0/0/0.subtree';

test('Tile3DSubtreeLoader#Should load quadtree subtree with constant availability', async (t) => {
  const EXPECTED = {
    buffers: [],
    bufferViews: [],
    tileAvailability: {constant: 1},
    childSubtreeAvailability: {constant: 0},
    contentAvailability: {constant: 1}
  };

  const availabilitySubtree = await load(FULL_SUBTREE_FILE_URL, Tile3DSubtreeLoader);

  t.ok(availabilitySubtree);
  t.deepEqual(availabilitySubtree, EXPECTED);
  t.end();
});

test('Tile3DSubtreeLoader#Should load quadtree subtree with expicitBitstream', async (t) => {
  const EXPECTED = {
    buffers: [{byteLength: 2}],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: 1},
      {buffer: 0, byteOffset: 1, byteLength: 1}
    ],
    tileAvailability: {bufferView: 0, explicitBitstream: new Uint8Array([29])},
    childSubtreeAvailability: {constant: 0},
    contentAvailability: {bufferView: 1, explicitBitstream: new Uint8Array([13])}
  };

  const availabilitySubtree = await load(INTERNAL_BINARY_SUBTREE_FILE_URL, Tile3DSubtreeLoader);

  t.ok(availabilitySubtree);
  t.deepEqual(availabilitySubtree, EXPECTED);
  t.end();
});

test('Tile3DSubtreeLoader#Should load octree subtree with expicitBitstream', async (t) => {
  const EXPECTED = {
    buffers: [{byteLength: 96}],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: 10},
      {buffer: 0, byteOffset: 16, byteLength: 10},
      {buffer: 0, byteOffset: 32, byteLength: 64}
    ],
    tileAvailability: {
      bitstream: 0,
      availableCount: 14,
      explicitBitstream: new Uint8Array([31, 1, 2, 3, 3, 1, 0, 0, 2, 1])
    },
    contentAvailability: [
      {
        bitstream: 1,
        availableCount: 3,
        explicitBitstream: new Uint8Array([2, 0, 2, 1, 0, 0, 0, 0, 0, 0])
      }
    ],
    childSubtreeAvailability: {
      bitstream: 2,
      availableCount: 12,
      explicitBitstream: new Uint8Array([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 129, 0, 0, 0, 0, 0, 0, 129, 129, 0, 0, 0, 0,
        0, 0, 129, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 129, 0,
        0, 0, 0, 0, 0, 129
      ])
    }
  };

  const availabilitySubtree = await load(
    INTERNAL_BINARY_SPARSE_SUBTREE_FILE_URL,
    Tile3DSubtreeLoader
  );

  t.ok(availabilitySubtree);
  t.deepEqual(availabilitySubtree, EXPECTED);
  t.end();
});
