// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource} from '../../src/hdf5/hdf5-binary';
import {createHDF5ChunkedDataset} from '../../src/hdf5/hdf5-chunk-backend';

test('HDF5 chunk backend exposes full and selected scientific array reads', async () => {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat32(0, 1.25, true);
  new DataView(bytes.buffer).setFloat32(4, 2.5, true);
  const descriptor = {
    shape: [2],
    chunkShape: [2],
    type: {kind: 'float' as const, size: 4, littleEndian: true, signed: true},
    filters: [],
    chunks: [{origin: [0], address: 0n, storedByteLength: 8, filterMask: 0}]
  };
  const dataset = createHDF5ChunkedDataset(new HDF5MemorySource(bytes), descriptor);
  expect(dataset.dtype).toBe('float32');
  expect(Array.from((await dataset.read()) as Float32Array)).toEqual([1.25, 2.5]);
  expect(Array.from((await dataset.readSelection!([[1, 2]])) as Float32Array)).toEqual([2.5]);
  expect(
    createHDF5ChunkedDataset(new HDF5MemorySource(bytes), {
      ...descriptor,
      type: {kind: 'integer', size: 4, littleEndian: true, signed: false}
    }).dtype
  ).toBe('uint32');
});
