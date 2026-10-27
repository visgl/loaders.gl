// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource, type HDF5Superblock} from '../../src/hdf5/hdf5-binary';
import {readHDF5ChunkBTreeV1} from '../../src/hdf5/hdf5-btree-v1';
import {parseHDF5ChunkLayout} from '../../src/hdf5/hdf5-chunk-index';

test('native v1 B-tree chunk index with two chunks', async () => {
  const bytes = new Uint8Array(256);
  bytes.set([84, 82, 69, 69, 1, 0, 2, 0], 32);
  const view = new DataView(bytes.buffer);
  const key = (offset: number, size: number, x: number) => {
    view.setUint32(offset, size, true);
    view.setUint32(offset + 4, 0, true);
    view.setBigUint64(offset + 8, BigInt(x), true);
    view.setBigUint64(offset + 16, 0n, true);
    view.setBigUint64(offset + 24, 0n, true);
  };
  key(56, 8, 0);
  view.setBigUint64(88, 128n, true);
  key(96, 8, 2);
  view.setBigUint64(128, 144n, true);
  key(136, 0, 4);
  const superblock = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  const chunks = await readHDF5ChunkBTreeV1(
    new HDF5MemorySource(bytes),
    superblock,
    32n,
    [4, 2],
    [2, 2]
  );
  expect(chunks.map(c => c.origin)).toEqual([
    [0, 0],
    [2, 0]
  ]);
  expect(chunks.map(c => c.address)).toEqual([128n, 144n]);
  const layout = new Uint8Array(3 + 3 * 4 + 8);
  layout.set([3, 2, 3], 0);
  const lv = new DataView(layout.buffer);
  lv.setUint32(3, 2, true);
  lv.setUint32(7, 2, true);
  lv.setUint32(11, 4, true);
  lv.setBigUint64(15, 32n, true);
  expect(parseHDF5ChunkLayout(layout, 2, 8, 8).indexType).toBe(0);
});

test('v1 B-tree validates dimensions, node headers, and traversal limits', async () => {
  const superblock = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  const bytes = new Uint8Array(128);
  const source = new HDF5MemorySource(bytes);
  await expect(readHDF5ChunkBTreeV1(source, superblock, 32n, [], [])).rejects.toThrow(/dimensions/);
  await expect(readHDF5ChunkBTreeV1(source, superblock, 32n, [4], [0])).rejects.toThrow(
    /dimensions/
  );
  await expect(readHDF5ChunkBTreeV1(source, superblock, 32n, [4, 2], [2, 2])).rejects.toThrow(
    /invalid v1 chunk B-tree node/
  );
  bytes.set([84, 82, 69, 69, 1, 0, 1, 16], 32);
  await expect(readHDF5ChunkBTreeV1(source, superblock, 32n, [4, 2], [2, 2])).rejects.toThrow(
    /oversized v1 B-tree node/
  );
  bytes[6 + 32] = 0;
  bytes[7 + 32] = 0;
  await expect(
    readHDF5ChunkBTreeV1(source, superblock, 32n, [4], [2], {maxNodes: 0})
  ).rejects.toThrow(/traversal limit/);
  await expect(
    readHDF5ChunkBTreeV1(source, {...superblock, baseAddress: -33n}, 32n, [4], [2])
  ).rejects.toThrow(/unsafe B-tree address/);
});

test('v1 B-tree rejects invalid chunk origins, cycles, and duplicate chunks', async () => {
  const bytes = new Uint8Array(256);
  const view = new DataView(bytes.buffer);
  const superblock = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  bytes.set([84, 82, 69, 69, 1, 0, 2, 0], 32);
  view.setUint32(56, 8, true);
  view.setBigUint64(88, 128n, true);
  view.setUint32(96, 8, true);
  view.setBigUint64(104, 2n, true);
  view.setBigUint64(128, 144n, true);
  view.setBigUint64(144, 4n, true);
  const source = new HDF5MemorySource(bytes);
  view.setBigUint64(104, 1n, true);
  await expect(readHDF5ChunkBTreeV1(source, superblock, 32n, [4, 2], [2, 2])).rejects.toThrow(
    /chunk origin/
  );
  view.setBigUint64(104, 0n, true);
  await expect(readHDF5ChunkBTreeV1(source, superblock, 32n, [4, 2], [2, 2])).rejects.toThrow(
    /duplicate v1 B-tree chunk/
  );
  bytes[37] = 1; // internal node points back to itself
  view.setBigUint64(88, 32n, true);
  await expect(readHDF5ChunkBTreeV1(source, superblock, 32n, [4, 2], [2, 2])).rejects.toThrow(
    /cycle or duplicate node/
  );
});
