// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource} from '../../src/hdf5/hdf5-binary';
import {readHDF5ChunkSelection} from '../../src/hdf5/hdf5-chunk-reader';

test('HDF5 chunk hyperslab fetches only intersecting chunks', async () => {
  const bytes = new Uint8Array(64);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < 8; i++) view.setFloat32(i * 4, i + 1, true);
  const requests: number[] = [];
  const memory = new HDF5MemorySource(bytes);
  const source = {
    async read(offset: number, length: number) {
      requests.push(offset);
      return memory.read(offset, length);
    }
  };
  const dataset = {
    shape: [2, 4],
    chunkShape: [2, 2],
    type: {kind: 'float' as const, size: 4, littleEndian: true, signed: true},
    filters: [],
    chunks: [
      {origin: [0, 0], address: 0n, storedByteLength: 16, filterMask: 0},
      {origin: [0, 2], address: 16n, storedByteLength: 16, filterMask: 0}
    ]
  };
  const selection = await readHDF5ChunkSelection(source, dataset, [
    [0, 2],
    [2, 4]
  ]);
  expect(requests).toEqual([16]);
  expect(Array.from(selection.data as Float32Array)).toEqual([5, 6, 7, 8]);
  expect(selection.shape).toEqual([2, 2]);
  expect(selection.stats.chunksFetched).toBe(1);
  expect(selection.stats.bytesFetched).toBe(16);
  await expect(
    readHDF5ChunkSelection(source, dataset, [
      [0, 2],
      [4, 5]
    ])
  ).rejects.toThrow(/invalid hyperslab/);
});
