// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource, type HDF5Superblock} from '../../src/hdf5/hdf5-binary';
import {readHDF5ObjectHeader} from '../../src/hdf5/hdf5-object-header';

test('HDF5 v2 object-header continuation message', async () => {
  const bytes = new Uint8Array(256);
  const view = new DataView(bytes.buffer);
  bytes.set([79, 72, 68, 82, 2, 0, 20], 32); // OHDR, version 2, chunk size 20
  bytes.set([16, 16, 0, 0], 39); // continuation message
  view.setBigUint64(43, 128n, true);
  view.setBigUint64(51, 16n, true);
  bytes.set([79, 67, 72, 75], 128); // OCHK
  bytes.set([3, 2, 0, 0, 42, 43], 132);
  const sb = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;
  const result = await readHDF5ObjectHeader(new HDF5MemorySource(bytes), sb, 32n);
  expect(result.messages.length).toBe(1);
  expect(result.messages[0].type).toBe(3);
  expect(Array.from(result.messages[0].payload)).toEqual([42, 43]);
  const cyclic = bytes.slice();
  view.setBigUint64(43, 128n, true);
});
