// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource, type HDF5Superblock} from '../../src/hdf5/hdf5-binary';
import {parseHDF5ChunkLayout, resolveHDF5ChunkIndex} from '../../src/hdf5/hdf5-chunk-index';

test('native HDF5 single chunk index and implicit contiguous chunk addressing', async () => {
  const bytes = new Uint8Array(14);
  bytes.set([4, 2, 0, 3, 1, 2, 2, 4, 1], 0);
  new DataView(bytes.buffer).setUint32(9, 128, true);
  const layout = parseHDF5ChunkLayout(bytes.subarray(0, 13), 2, 4, 8);
  expect(layout.indexType).toBe(1);
  const superblock = {baseAddress: 0n, offsetSize: 4, lengthSize: 8} as HDF5Superblock;
  const entries = await resolveHDF5ChunkIndex(
    new HDF5MemorySource(new Uint8Array(1)),
    superblock,
    layout,
    [2, 2]
  );
  expect(entries).toEqual([{origin: [0, 0], address: 128n, storedByteLength: 16, filterMask: 0}]);
  const implicit = new Uint8Array([4, 2, 0, 3, 1, 2, 2, 4, 2, 128, 0, 0, 0]);
  const parsed = parseHDF5ChunkLayout(implicit, 2, 4, 8);
  const chunks = await resolveHDF5ChunkIndex(
    new HDF5MemorySource(new Uint8Array(1)),
    superblock,
    parsed,
    [4, 2]
  );
  expect(chunks.map(chunk => chunk.address)).toEqual([128n, 144n]);
});
