// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {parseHDF5FillValue} from '../../src/hdf5/hdf5-fill-value';
import {readHDF5ChunkSelection} from '../../src/hdf5/hdf5-chunk-reader';
import {HDF5MemorySource} from '../../src/hdf5/hdf5-binary';

test('HDF5 fill-value decoding and sparse chunk materialization', async () => {
  const type = {kind: 'float' as const, size: 4, littleEndian: true, signed: true};
  const message = new Uint8Array(10);
  message.set([3, 0x20, 4, 0, 0, 0]);
  new DataView(message.buffer).setFloat32(6, -999, true);
  expect(parseHDF5FillValue(message, type)).toBe(-999);
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat32(0, 1, true);
  new DataView(bytes.buffer).setFloat32(4, 2, true);
  const dataset = {
    shape: [2, 2],
    chunkShape: [1, 2],
    type,
    filters: [],
    fillValue: -999,
    chunks: [{origin: [0, 0], address: 0n, storedByteLength: 8, filterMask: 0}]
  };
  const result = await readHDF5ChunkSelection(new HDF5MemorySource(bytes), dataset, [
    [0, 2],
    [0, 2]
  ]);
  expect(Array.from(result.data as Float32Array)).toEqual([1, 2, -999, -999]);
  await expect(
    readHDF5ChunkSelection(new HDF5MemorySource(bytes), {...dataset, fillValue: undefined}, [
      [0, 2],
      [0, 2]
    ])
  ).rejects.toThrow(/unallocated chunks/);
});
