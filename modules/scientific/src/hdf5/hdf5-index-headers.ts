// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {HDF5ByteSource, HDF5Superblock} from './hdf5-binary';
import {hdf5Checksum} from './hdf5-binary';
import {readHDF5Unsigned} from './hdf5-dataset-messages';

/** Validated B-tree v2 header metadata; records are not traversed. */
export type HDF5BTreeV2Header = {
  /** B-tree client identifier. */
  type: number;
  /** Bytes in each B-tree node. */
  nodeSize: number;
  /** Bytes in each record. */
  recordSize: number;
  /** Number of tree levels below the root. */
  depth: number;
  /** Root-node address, if allocated. */
  rootAddress: bigint | null;
  /** Number of records in the root node. */
  rootRecords: number;
  /** Total number of records in the tree. */
  totalRecords: bigint;
};
/** Validated extensible-array header metadata; records are not traversed. */
export type HDF5ExtensibleArrayHeader = {
  /** Extensible-array client identifier. */
  client: number;
  /** Bytes in each array element. */
  elementSize: number;
  /** Maximum array index width. */
  maxElementsBits: number;
  /** Elements in the index block. */
  indexBlockElements: number;
  /** Minimum elements in each data block. */
  dataBlockMinElements: number;
  /** Minimum pointers in each secondary block. */
  secondaryBlockMinPointers: number;
  /** Page-size exponent for data blocks. */
  dataBlockPageBits: number;
  /** Index-block address, if allocated. */
  indexBlockAddress: bigint | null;
};
function check(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error('HDF5: ' + reason);
}
function u(bytes: Uint8Array, start: number, length: number): number {
  const value = readHDF5Unsigned(bytes, start, length);
  check(value <= BigInt(Number.MAX_SAFE_INTEGER), 'unsafe index integer');
  return Number(value);
}
function address(bytes: Uint8Array, start: number, length: number): bigint | null {
  const value = readHDF5Unsigned(bytes, start, length);
  return value === (1n << BigInt(length * 8)) - 1n ? null : value;
}
async function readAt(
  source: HDF5ByteSource,
  superblock: HDF5Superblock,
  relative: bigint,
  length: number,
  signal?: AbortSignal
): Promise<Uint8Array> {
  const absolute = superblock.baseAddress + relative;
  check(absolute >= 0n && absolute <= BigInt(Number.MAX_SAFE_INTEGER), 'unsafe index address');
  const bytes = await source.read(Number(absolute), length, signal);
  check(bytes.length === length, 'truncated index header');
  return bytes;
}
function verify(bytes: Uint8Array): void {
  check(
    hdf5Checksum(bytes.subarray(0, -4)) === u(bytes, bytes.length - 4, 4),
    'index header checksum mismatch'
  );
}
/** Validate and decode a B-tree v2 (BTHD) header, without claiming record traversal. */
export async function readHDF5BTreeV2Header(
  source: HDF5ByteSource,
  superblock: HDF5Superblock,
  relative: bigint,
  signal?: AbortSignal
): Promise<HDF5BTreeV2Header> {
  const {offsetSize, lengthSize} = superblock;
  const bytes = await readAt(source, superblock, relative, 22 + offsetSize + lengthSize, signal);
  check(
    String.fromCharCode(...bytes.subarray(0, 4)) === 'BTHD' && bytes[4] === 0,
    'invalid B-tree v2 header'
  );
  verify(bytes);
  const nodeSize = u(bytes, 6, 4),
    recordSize = u(bytes, 10, 2),
    depth = u(bytes, 12, 2);
  check(
    nodeSize >= 32 &&
      nodeSize <= 16 * 1024 * 1024 &&
      recordSize > 0 &&
      recordSize <= nodeSize &&
      depth <= 32,
    'invalid B-tree v2 geometry'
  );
  const rootOffset = 16;
  return {
    type: bytes[5],
    nodeSize,
    recordSize,
    depth,
    rootAddress: address(bytes, rootOffset, offsetSize),
    rootRecords: u(bytes, rootOffset + offsetSize, 2),
    totalRecords: readHDF5Unsigned(bytes, rootOffset + offsetSize + 2, lengthSize)
  };
}
/** Validate extensible-array header (EAHD) and expose index-block pointer. */
export async function readHDF5ExtensibleArrayHeader(
  source: HDF5ByteSource,
  superblock: HDF5Superblock,
  relative: bigint,
  signal?: AbortSignal
): Promise<HDF5ExtensibleArrayHeader> {
  const {offsetSize, lengthSize} = superblock;
  const bytes = await readAt(
    source,
    superblock,
    relative,
    12 + 6 * lengthSize + offsetSize + 4,
    signal
  );
  check(
    String.fromCharCode(...bytes.subarray(0, 4)) === 'EAHD' && bytes[4] === 0,
    'invalid extensible-array header'
  );
  verify(bytes);
  const elementSize = bytes[6];
  const maxElementsBits = bytes[7];
  const indexBlockElements = bytes[8];
  const dataBlockMinElements = bytes[9];
  const secondaryBlockMinPointers = bytes[10];
  const dataBlockPageBits = bytes[11];
  check(
    elementSize > 0 &&
      maxElementsBits > 0 &&
      maxElementsBits <= 64 &&
      indexBlockElements > 0 &&
      dataBlockMinElements > 0,
    'invalid extensible-array geometry'
  );
  return {
    client: bytes[5],
    elementSize,
    maxElementsBits,
    indexBlockElements,
    dataBlockMinElements,
    secondaryBlockMinPointers,
    dataBlockPageBits,
    indexBlockAddress: address(bytes, 12 + 6 * lengthSize, offsetSize)
  };
}
