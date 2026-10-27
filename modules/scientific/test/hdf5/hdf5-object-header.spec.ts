// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource, type HDF5Superblock} from '../../src/hdf5/hdf5-binary';
import {readHDF5ObjectHeader} from '../../src/hdf5/hdf5-object-header';

test('HDF5 v2 object header messages and truncation', async () => {
  const data = new Uint8Array(128);
  const address = 32;
  data.set([79, 72, 68, 82, 2, 0, 9, 3, 2, 0, 0, 10, 20, 0, 0, 0], address);
  const superblock = {
    baseAddress: 0n,
    offsetSize: 8,
    lengthSize: 8
  } as HDF5Superblock;
  const header = await readHDF5ObjectHeader(new HDF5MemorySource(data), superblock, 32n);
  expect(header.messages.length).toBe(1);
  expect(header.messages[0].type).toBe(3);
  expect(Array.from(header.messages[0].payload)).toEqual([10, 20]);
  const bad = data.slice();
  bad[address + 9] = 255;
  await expect(readHDF5ObjectHeader(new HDF5MemorySource(bad), superblock, 32n)).rejects.toThrow(
    /truncated object message/
  );
});

test('HDF5 object headers reject invalid prefixes, versions, and oversized chunks', async () => {
  const bytes = new Uint8Array(128);
  const superblock = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  const source = new HDF5MemorySource(bytes);
  await expect(readHDF5ObjectHeader(source, superblock, 32n)).rejects.toThrow(/OHDR/);
  bytes.set([79, 72, 68, 82, 3, 0, 0], 32);
  await expect(readHDF5ObjectHeader(source, superblock, 32n)).rejects.toThrow(/version/);
  bytes.set([79, 72, 68, 82, 2, 3], 32);
  new DataView(bytes.buffer).setUint32(38, 64 * 1024 * 1024 + 1, true);
  await expect(readHDF5ObjectHeader(source, superblock, 32n)).rejects.toThrow(/oversized/);
  await expect(
    readHDF5ObjectHeader(source, {...superblock, baseAddress: BigInt(Number.MAX_SAFE_INTEGER)}, 1n)
  ).rejects.toThrow(/safe JS range/);
});

test('HDF5 object headers decode optional prefix fields and reject shared messages', async () => {
  const bytes = new Uint8Array(128);
  const superblock = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  bytes.set([79, 72, 68, 82, 2, 0x34], 32); // creation order, timestamp, phase change
  bytes[58] = 8; // one-byte chunk length after optional prefix fields
  bytes.set([3, 2, 0, 0, 0, 0, 42, 43], 59);
  const header = await readHDF5ObjectHeader(new HDF5MemorySource(bytes), superblock, 32n);
  expect(Array.from(header.messages[0].payload)).toEqual([42, 43]);
  bytes[62] = 2;
  await expect(readHDF5ObjectHeader(new HDF5MemorySource(bytes), superblock, 32n)).rejects.toThrow(
    /shared object messages/
  );
});

test('HDF5 object headers reject malformed continuation metadata and chunks', async () => {
  const bytes = new Uint8Array(256);
  const superblock = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  bytes.set([79, 72, 68, 82, 2, 0, 20, 16, 16, 0, 0], 32);
  const view = new DataView(bytes.buffer);
  view.setBigUint64(43, 128n, true);
  view.setBigUint64(51, 16n, true);
  await expect(readHDF5ObjectHeader(new HDF5MemorySource(bytes), superblock, 32n)).rejects.toThrow(
    /invalid continuation chunk/
  );
  bytes.set([79, 67, 72, 75], 128);
  view.setBigUint64(51, 4n, true);
  await expect(readHDF5ObjectHeader(new HDF5MemorySource(bytes), superblock, 32n)).rejects.toThrow(
    /invalid continuation length/
  );
  view.setBigUint64(51, 16n, true);
  bytes[40] = 15;
  await expect(readHDF5ObjectHeader(new HDF5MemorySource(bytes), superblock, 32n)).rejects.toThrow(
    /malformed continuation message/
  );
});
