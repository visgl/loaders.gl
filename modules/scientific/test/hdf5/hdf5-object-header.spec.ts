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
