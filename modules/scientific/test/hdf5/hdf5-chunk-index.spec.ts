// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource, hdf5Checksum, type HDF5Superblock} from '../../src/hdf5/hdf5-binary';
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

test('native HDF5 unfiltered fixed-array index resolves chunk addresses', async () => {
  const bytes = new Uint8Array(160);
  const view = new DataView(bytes.buffer);
  bytes.set([70, 65, 72, 68, 0, 0, 8, 4]);
  view.setBigUint64(8, 2n, true);
  view.setBigUint64(16, 64n, true);
  view.setUint32(24, hdf5Checksum(bytes.subarray(0, 24)), true);
  bytes.set([70, 65, 68, 66, 0, 0], 64);
  view.setBigUint64(70, 0n, true);
  view.setBigUint64(78, 128n, true);
  view.setBigUint64(86, 136n, true);
  view.setUint32(94, hdf5Checksum(bytes.subarray(64, 94)), true);
  const layout = new Uint8Array(17);
  layout.set([4, 2, 0, 2, 1, 2, 4, 3, 4]);
  const parsed = parseHDF5ChunkLayout(layout, 1, 8, 8);
  const superblock = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  const chunks = await resolveHDF5ChunkIndex(new HDF5MemorySource(bytes), superblock, parsed, [4]);
  expect(chunks).toEqual([
    {origin: [0], address: 128n, storedByteLength: 8, filterMask: 0},
    {origin: [2], address: 136n, storedByteLength: 8, filterMask: 0}
  ]);
  const corrupted = bytes.slice();
  corrupted[24] ^= 1;
  await expect(
    resolveHDF5ChunkIndex(new HDF5MemorySource(corrupted), superblock, parsed, [4])
  ).rejects.toThrow(/fixed-array header checksum mismatch/);
});

test('native HDF5 chunk layout rejects malformed dimensions and unsupported indexes', async () => {
  expect(() => parseHDF5ChunkLayout(new Uint8Array([4, 2]), 1, 8, 8)).toThrow(
    /expected v4\/v5 chunked layout/
  );
  const layout = new Uint8Array(16);
  layout.set([4, 2, 0, 2, 1, 2, 4, 1]);
  layout.fill(255, 8);
  const parsed = parseHDF5ChunkLayout(layout, 1, 8, 8);
  const superblock = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  expect(
    await resolveHDF5ChunkIndex(new HDF5MemorySource(new Uint8Array()), superblock, parsed, [2])
  ).toEqual([]);
  const malformed = layout.slice();
  malformed[6] = 0;
  expect(() => parseHDF5ChunkLayout(malformed, 1, 8, 8)).toThrow(/invalid chunk element size/);
  const invalidIndex = layout.slice();
  invalidIndex[7] = 9;
  expect(() => parseHDF5ChunkLayout(invalidIndex, 1, 8, 8)).toThrow(
    /chunk index type not yet supported/
  );
});
