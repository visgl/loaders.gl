// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {Tile3DSubtreeLoader} from '@loaders.gl/3d-tiles';

const FULL_SUBTREE_FILE_URL = '@loaders.gl/3d-tiles/test/data/full.subtree';
const INTERNAL_BINARY_SUBTREE_FILE_URL = '@loaders.gl/3d-tiles/test/data/internalBinary.subtree';
const INTERNAL_BINARY_SPARSE_SUBTREE_FILE_URL = '@loaders.gl/3d-tiles/test/data/sparse.subtree';

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
    buffers: [{byteLength: 9}],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: 1},
      {buffer: 0, byteOffset: 1, byteLength: 8}
    ],
    tileAvailability: {bufferView: 0, explicitBitstream: new Uint8Array([3])},
    childSubtreeAvailability: {
      bufferView: 1,
      explicitBitstream: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0])
    },
    contentAvailability: {bufferView: 0, explicitBitstream: new Uint8Array([3])}
  };

  const availabilitySubtree = await load(
    INTERNAL_BINARY_SPARSE_SUBTREE_FILE_URL,
    Tile3DSubtreeLoader
  );

  t.ok(availabilitySubtree);
  t.deepEqual(availabilitySubtree, EXPECTED);
  t.end();
});
