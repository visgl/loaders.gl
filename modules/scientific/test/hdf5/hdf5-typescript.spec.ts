// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource, hdf5Checksum, readHDF5Superblock} from '../../src/hdf5/hdf5-binary';
import {HDF5TypeScriptFile} from '../../src/hdf5/hdf5-typescript-source';

function makeSuperblock(offset = 0): Uint8Array {
  const data = new Uint8Array(offset + 512);
  const bytes = data.subarray(offset);
  bytes.set([137, 72, 68, 70, 13, 10, 26, 10, 3, 8, 8, 0]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setBigUint64(12, BigInt(offset), true);
  view.setBigUint64(20, 0xffffffffffffffffn, true);
  view.setBigUint64(28, BigInt(offset + 512), true);
  view.setBigUint64(36, 128n, true);
  view.setUint32(44, hdf5Checksum(bytes.subarray(0, 44)), true);
  return data;
}
test('TypeScript HDF5 v3 superblock with checksum', async () => {
  const file = await HDF5TypeScriptFile.fromBytes(makeSuperblock());
  expect(file.superblock.version).toBe(3);
  expect(file.superblock.rootObjectHeaderAddress).toBe(128n);
  expect(file.superblock.extensionAddress).toBe(null);
  const withUserBlock = await readHDF5Superblock(new HDF5MemorySource(makeSuperblock(512)));
  expect(withUserBlock.superblockOffset).toBe(512);
  const corrupted = makeSuperblock();
  corrupted[12] ^= 1;
  await expect(readHDF5Superblock(new HDF5MemorySource(corrupted))).rejects.toThrow(
    /checksum mismatch/
  );
});
