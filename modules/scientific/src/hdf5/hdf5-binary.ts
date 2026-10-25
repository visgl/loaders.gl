// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Random-access byte provider. All offsets are absolute file offsets. */
export interface HDF5ByteSource {
  /** Read a byte range from an absolute file offset. */
  read(offset: number, length: number, signal?: AbortSignal): Promise<Uint8Array>;
}
/** In-memory byte source for bounded HDF5 reads. */
export class HDF5MemorySource implements HDF5ByteSource {
  /** File bytes retained by the source. */
  private readonly bytes: Uint8Array;
  /** Create a byte source from a buffer or typed array. */
  constructor(data: ArrayBuffer | Uint8Array) {
    this.bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  }
  /** Read a validated byte range without copying it. */
  async read(offset: number, length: number): Promise<Uint8Array> {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 0 ||
      offset + length > this.bytes.length
    ) {
      throw new RangeError('HDF5: byte range outside input');
    }
    return this.bytes.subarray(offset, offset + length);
  }
}
/** Parsed HDF5 v2/v3 superblock address metadata. */
export type HDF5Superblock = {
  /** Superblock version. */
  version: 2 | 3;
  /** Bytes used for file addresses. */
  offsetSize: number;
  /** Bytes used for stored lengths. */
  lengthSize: number;
  /** Base address for relative HDF5 addresses. */
  baseAddress: bigint;
  /** Optional superblock extension address. */
  extensionAddress: bigint | null;
  /** Address of the logical end of the file. */
  endOfFileAddress: bigint;
  /** Root group object-header address. */
  rootObjectHeaderAddress: bigint;
  /** Stored superblock checksum. */
  checksum: number;
  /** Absolute offset where the superblock was found. */
  superblockOffset: number;
};
const SIGNATURE = [137, 72, 68, 70, 13, 10, 26, 10];
function requireBytes(bytes: Uint8Array, length: number): void {
  if (bytes.length !== length) throw new Error('HDF5: truncated byte-range response');
}
function readUnsigned(bytes: Uint8Array, offset: number, length: number): bigint {
  if (offset + length > bytes.length) throw new Error('HDF5: truncated address');
  let value = 0n;
  for (let i = length - 1; i >= 0; i--) value = (value << 8n) | BigInt(bytes[offset + i]);
  return value;
}
function address(bytes: Uint8Array, offset: number, length: number): bigint | null {
  const raw = readUnsigned(bytes, offset, length);
  return raw === (1n << BigInt(length * 8)) - 1n ? null : raw;
}
/** HDF5 metadata checksum (Jenkins lookup3 hashlittle). */
export function hdf5Checksum(data: Uint8Array): number {
  let a = (0xdeadbeef + data.length) >>> 0,
    b = a,
    c = a;
  const rot = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;
  const mix = () => {
    a = (a - c) >>> 0;
    a ^= rot(c, 4);
    c = (c + b) >>> 0;
    b = (b - a) >>> 0;
    b ^= rot(a, 6);
    a = (a + c) >>> 0;
    c = (c - b) >>> 0;
    c ^= rot(b, 8);
    b = (b + a) >>> 0;
    a = (a - c) >>> 0;
    a ^= rot(c, 16);
    c = (c + b) >>> 0;
    b = (b - a) >>> 0;
    b ^= rot(a, 19);
    a = (a + c) >>> 0;
    c = (c - b) >>> 0;
    c ^= rot(b, 4);
    b = (b + a) >>> 0;
  };
  let i = 0;
  while (i + 12 <= data.length) {
    a = (a + Number(readUnsigned(data, i, 4))) >>> 0;
    b = (b + Number(readUnsigned(data, i + 4, 4))) >>> 0;
    c = (c + Number(readUnsigned(data, i + 8, 4))) >>> 0;
    mix();
    i += 12;
  }
  const tail = data.subarray(i);
  if (tail.length === 0) return c >>> 0;
  for (let j = 0; j < tail.length; j++) {
    const shift = (j % 4) * 8;
    if (j < 4) a = (a + tail[j] * 2 ** shift) >>> 0;
    else if (j < 8) b = (b + tail[j] * 2 ** shift) >>> 0;
    else c = (c + tail[j] * 2 ** shift) >>> 0;
  }
  c ^= b;
  c = (c - rot(b, 14)) >>> 0;
  a ^= c;
  a = (a - rot(c, 11)) >>> 0;
  b ^= a;
  b = (b - rot(a, 25)) >>> 0;
  c ^= b;
  c = (c - rot(b, 16)) >>> 0;
  a ^= c;
  a = (a - rot(c, 4)) >>> 0;
  b ^= a;
  b = (b - rot(a, 14)) >>> 0;
  c ^= b;
  c = (c - rot(b, 24)) >>> 0;
  return c >>> 0;
}
/** Locate an HDF5 signature at 0 or a legal power-of-two user-block offset. */
export async function locateHDF5Superblock(
  source: HDF5ByteSource,
  signal?: AbortSignal
): Promise<number> {
  for (let offset = 0; offset <= 1 << 20; offset = offset === 0 ? 512 : offset * 2) {
    const bytes = await source.read(offset, 8, signal);
    requireBytes(bytes, 8);
    if (SIGNATURE.every((byte, i) => bytes[i] === byte)) return offset;
  }
  throw new Error('HDF5: signature not found in supported user-block search');
}
/** Read and validate HDF5 superblock versions 2 and 3 without loading the whole file. */
export async function readHDF5Superblock(
  source: HDF5ByteSource,
  signal?: AbortSignal
): Promise<HDF5Superblock> {
  const superblockOffset = await locateHDF5Superblock(source, signal);
  const prefix = await source.read(superblockOffset, 12, signal);
  requireBytes(prefix, 12);
  const version = prefix[8];
  if (version !== 2 && version !== 3) {
    throw new Error('HDF5: unsupported superblock version ' + version);
  }
  const offsetSize = prefix[9],
    lengthSize = prefix[10];
  if (![2, 4, 8].includes(offsetSize) || ![2, 4, 8].includes(lengthSize)) {
    throw new Error('HDF5: unsupported address/length width');
  }
  const size = 12 + offsetSize * 4 + 4;
  const bytes = await source.read(superblockOffset, size, signal);
  requireBytes(bytes, size);
  let cursor = 12;
  const baseAddress = readUnsigned(bytes, cursor, offsetSize);
  cursor += offsetSize;
  const extensionAddress = address(bytes, cursor, offsetSize);
  cursor += offsetSize;
  const endOfFileAddress = readUnsigned(bytes, cursor, offsetSize);
  cursor += offsetSize;
  const rootObjectHeaderAddress = address(bytes, cursor, offsetSize);
  cursor += offsetSize;
  if (rootObjectHeaderAddress === null) throw new Error('HDF5: missing root object header');
  const checksum = Number(readUnsigned(bytes, cursor, 4));
  if (hdf5Checksum(bytes.subarray(0, cursor)) !== checksum) {
    throw new Error('HDF5: superblock checksum mismatch');
  }
  return {
    version,
    offsetSize,
    lengthSize,
    baseAddress,
    extensionAddress,
    endOfFileAddress,
    rootObjectHeaderAddress,
    checksum,
    superblockOffset
  };
}
