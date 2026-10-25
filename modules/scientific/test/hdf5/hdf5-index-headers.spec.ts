// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HDF5MemorySource, hdf5Checksum, type HDF5Superblock} from '../../src/hdf5/hdf5-binary';
import {
  readHDF5BTreeV2Header,
  readHDF5ExtensibleArrayHeader
} from '../../src/hdf5/hdf5-index-headers';

const SUPERBLOCK = {baseAddress: 0n, offsetSize: 8, lengthSize: 8} as HDF5Superblock;

/** Write the trailing HDF5 metadata checksum. */
function writeChecksum(bytes: Uint8Array): void {
  new DataView(bytes.buffer).setUint32(bytes.length - 4, hdf5Checksum(bytes.subarray(0, -4)), true);
}

/** Build a valid B-tree v2 header without records. */
function makeBTreeHeader(): Uint8Array {
  const bytes = new Uint8Array(38);
  const view = new DataView(bytes.buffer);
  bytes.set([66, 84, 72, 68, 0, 1]);
  view.setUint32(6, 512, true);
  view.setUint16(10, 16, true);
  view.setUint16(12, 2, true);
  view.setBigUint64(16, 256n, true);
  view.setUint16(24, 3, true);
  view.setBigUint64(26, 9n, true);
  writeChecksum(bytes);
  return bytes;
}

/** Build a valid extensible-array header without index records. */
function makeExtensibleArrayHeader(): Uint8Array {
  const bytes = new Uint8Array(72);
  const view = new DataView(bytes.buffer);
  bytes.set([69, 65, 72, 68, 0, 2, 8, 32, 4, 2, 1, 3]);
  view.setBigUint64(60, 256n, true);
  writeChecksum(bytes);
  return bytes;
}

test('HDF5 B-tree v2 header exposes bounded index metadata', async () => {
  const bytes = makeBTreeHeader();
  expect(await readHDF5BTreeV2Header(new HDF5MemorySource(bytes), SUPERBLOCK, 0n)).toEqual({
    type: 1,
    nodeSize: 512,
    recordSize: 16,
    depth: 2,
    rootAddress: 256n,
    rootRecords: 3,
    totalRecords: 9n
  });
  const missingRoot = bytes.slice();
  missingRoot.fill(255, 16, 24);
  writeChecksum(missingRoot);
  expect(
    (await readHDF5BTreeV2Header(new HDF5MemorySource(missingRoot), SUPERBLOCK, 0n)).rootAddress
  ).toBeNull();
});

test('HDF5 B-tree v2 header rejects invalid signature, geometry and checksum', async () => {
  const signature = makeBTreeHeader();
  signature[0] = 0;
  await expect(
    readHDF5BTreeV2Header(new HDF5MemorySource(signature), SUPERBLOCK, 0n)
  ).rejects.toThrow(/invalid B-tree v2 header/);
  const geometry = makeBTreeHeader();
  new DataView(geometry.buffer).setUint32(6, 8, true);
  writeChecksum(geometry);
  await expect(
    readHDF5BTreeV2Header(new HDF5MemorySource(geometry), SUPERBLOCK, 0n)
  ).rejects.toThrow(/invalid B-tree v2 geometry/);
  const checksum = makeBTreeHeader();
  checksum[10] ^= 1;
  await expect(
    readHDF5BTreeV2Header(new HDF5MemorySource(checksum), SUPERBLOCK, 0n)
  ).rejects.toThrow(/checksum mismatch/);
  await expect(
    readHDF5BTreeV2Header(new HDF5MemorySource(new Uint8Array(10)), SUPERBLOCK, 0n)
  ).rejects.toThrow(/byte range outside input/);
});

test('HDF5 extensible-array header exposes bounded metadata and rejects malformed input', async () => {
  const bytes = makeExtensibleArrayHeader();
  expect(await readHDF5ExtensibleArrayHeader(new HDF5MemorySource(bytes), SUPERBLOCK, 0n)).toEqual({
    client: 2,
    elementSize: 8,
    maxElementsBits: 32,
    indexBlockElements: 4,
    dataBlockMinElements: 2,
    secondaryBlockMinPointers: 1,
    dataBlockPageBits: 3,
    indexBlockAddress: 256n
  });
  const geometry = bytes.slice();
  geometry[6] = 0;
  writeChecksum(geometry);
  await expect(
    readHDF5ExtensibleArrayHeader(new HDF5MemorySource(geometry), SUPERBLOCK, 0n)
  ).rejects.toThrow(/invalid extensible-array geometry/);
  const signature = bytes.slice();
  signature[0] = 0;
  await expect(
    readHDF5ExtensibleArrayHeader(new HDF5MemorySource(signature), SUPERBLOCK, 0n)
  ).rejects.toThrow(/invalid extensible-array header/);
});
