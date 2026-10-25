// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {HDF5ByteSource, HDF5Superblock} from './hdf5-binary';
import {hdf5Checksum} from './hdf5-binary';
import {readHDF5Unsigned} from './hdf5-dataset-messages';
import type {HDF5ChunkEntry} from './hdf5-chunk-reader';
import {readHDF5ChunkBTreeV1} from './hdf5-btree-v1';
import {readHDF5BTreeV2Header, readHDF5ExtensibleArrayHeader} from './hdf5-index-headers';

type ChunkLayout = {
  version: 3 | 4 | 5;
  indexType: 0 | 1 | 2 | 3 | 4 | 5;
  chunkShape: number[];
  elementSize: number;
  flags: number;
  address: bigint | null;
  filteredSize?: number;
  filterMask?: number;
  pageBits?: number;
};
function assert(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error('HDF5: ' + reason);
}
function number(bytes: Uint8Array, start: number, size: number): number {
  const value = readHDF5Unsigned(bytes, start, size);
  assert(value <= BigInt(Number.MAX_SAFE_INTEGER), 'unsafe HDF5 integer');
  return Number(value);
}
function address(bytes: Uint8Array, start: number, size: number): bigint | null {
  const value = readHDF5Unsigned(bytes, start, size);
  return value === (1n << BigInt(size * 8)) - 1n ? null : value;
}
function fileAddress(base: bigint, relative: bigint): number {
  const absolute = base + relative;
  assert(absolute >= 0n && absolute <= BigInt(Number.MAX_SAFE_INTEGER), 'unsafe file address');
  return Number(absolute);
}
function shapeProduct(shape: readonly number[]): number {
  return shape.reduce((product, value) => {
    assert(
      Number.isSafeInteger(value) && value > 0 && product <= 10_000_000 / value,
      'invalid or oversized chunk index'
    );
    return product * value;
  }, 1);
}
function coordinates(
  index: number,
  counts: readonly number[],
  chunkShape: readonly number[]
): number[] {
  const result = Array<number>(counts.length);
  for (let axis = counts.length - 1; axis >= 0; axis--) {
    result[axis] = (index % counts[axis]) * chunkShape[axis];
    index = Math.floor(index / counts[axis]);
  }
  return result;
}
/** Decode a version 3, 4, or 5 chunked data-layout message and its index descriptor. */
export function parseHDF5ChunkLayout(
  bytes: Uint8Array,
  rank: number,
  offsetSize: number,
  lengthSize: number
): ChunkLayout {
  if (bytes[0] === 3 && bytes[1] === 2) {
    const dimensionCount = bytes[2];
    assert(
      dimensionCount === rank + 1 && bytes.length === 3 + dimensionCount * 4 + offsetSize,
      'invalid v3 chunk layout'
    );
    const dimensions = Array.from({length: dimensionCount}, (_, i) => number(bytes, 3 + i * 4, 4));
    const elementSize = dimensions.pop()!;
    assert(elementSize > 0, 'invalid chunk element size');
    return {
      version: 3,
      indexType: 0,
      chunkShape: dimensions,
      elementSize,
      flags: 0,
      address: address(bytes, 3 + dimensionCount * 4, offsetSize)
    };
  }
  assert(
    bytes.length >= 7 && (bytes[0] === 4 || bytes[0] === 5) && bytes[1] === 2,
    'expected v4/v5 chunked layout'
  );
  const version = bytes[0] as 4 | 5,
    flags = bytes[2],
    dimensionCount = bytes[3],
    extentSize = bytes[4];
  assert(
    rank > 0 && rank <= 32 && dimensionCount === rank + 1 && extentSize >= 1 && extentSize <= 8,
    'invalid chunk dimension encoding'
  );
  let cursor = 5;
  const dimensions: number[] = [];
  for (let i = 0; i < dimensionCount; i++) {
    dimensions.push(number(bytes, cursor, extentSize));
    cursor += extentSize;
  }
  const elementSize = dimensions.pop()!;
  assert(elementSize > 0 && elementSize <= 1024, 'invalid chunk element size');
  const indexType = bytes[cursor++];
  assert(indexType >= 1 && indexType <= 5, 'chunk index type not yet supported: ' + indexType);
  let filteredSize: number | undefined,
    filterMask: number | undefined,
    pageBits: number | undefined;
  if (indexType === 1 && flags & 2) {
    filteredSize = number(bytes, cursor, lengthSize);
    cursor += lengthSize;
    filterMask = number(bytes, cursor, 4);
    cursor += 4;
  } else if (indexType === 4) {
    assert(cursor + 5 <= bytes.length, 'truncated extensible-array index parameters');
    cursor += 5;
  } else if (indexType === 5) {
    assert(cursor + 6 <= bytes.length, 'truncated B-tree v2 index parameters');
    cursor += 6;
  } else if (indexType === 3) {
    assert(cursor < bytes.length, 'truncated fixed-array index');
    pageBits = bytes[cursor++];
  }
  const indexAddress = address(bytes, cursor, offsetSize);
  assert(cursor + offsetSize === bytes.length, 'unexpected chunk layout trailing bytes');
  return {
    version,
    indexType: indexType as ChunkLayout['indexType'],
    chunkShape: dimensions,
    elementSize,
    flags,
    address: indexAddress,
    filteredSize,
    filterMask,
    pageBits
  };
}
/** Resolve v4/v5 single, implicit and unpaged fixed-array chunk indexes. */
export async function resolveHDF5ChunkIndex(
  source: HDF5ByteSource,
  superblock: HDF5Superblock,
  layout: ChunkLayout,
  shape: readonly number[],
  signal?: AbortSignal
): Promise<HDF5ChunkEntry[]> {
  assert(shape.length === layout.chunkShape.length, 'chunk index rank mismatch');
  if (layout.indexType === 0 && layout.address !== null) {
    return readHDF5ChunkBTreeV1(source, superblock, layout.address, shape, layout.chunkShape, {
      signal
    });
  }
  if (layout.address === null) return [];
  const counts = shape.map((size, i) => Math.ceil(size / layout.chunkShape[i]));
  const count = shapeProduct(counts);
  const chunkBytes = shapeProduct(layout.chunkShape) * layout.elementSize;
  assert(Number.isSafeInteger(chunkBytes) && chunkBytes <= 512 * 1024 * 1024, 'chunk too large');
  const base = superblock.baseAddress;
  if (layout.indexType === 1) {
    assert(count === 1, 'single-chunk index has multiple logical chunks');
    return [
      {
        origin: shape.map(() => 0),
        address: base + layout.address,
        storedByteLength: layout.filteredSize ?? chunkBytes,
        filterMask: layout.filterMask ?? 0
      }
    ];
  }
  if (layout.indexType === 2) {
    return Array.from({length: count}, (_, index) => ({
      origin: coordinates(index, counts, layout.chunkShape),
      address: base + layout.address! + BigInt(index * chunkBytes),
      storedByteLength: chunkBytes,
      filterMask: 0
    }));
  }
  if (layout.indexType === 4) {
    await readHDF5ExtensibleArrayHeader(source, superblock, layout.address, signal);
    throw new Error('HDF5: extensible-array record traversal not yet supported');
  }
  if (layout.indexType === 5) {
    await readHDF5BTreeV2Header(source, superblock, layout.address, signal);
    throw new Error('HDF5: B-tree v2 record traversal not yet supported');
  }
  const offsetSize = superblock.offsetSize,
    lengthSize = superblock.lengthSize;
  const headerLength = 8 + lengthSize + offsetSize + 4;
  const header = await source.read(fileAddress(base, layout.address), headerLength, signal);
  assert(
    header.length === headerLength &&
      String.fromCharCode(...header.subarray(0, 4)) === 'FAHD' &&
      header[4] === 0 &&
      header[5] <= 1,
    'invalid fixed-array header'
  );
  const client = header[5],
    entrySize = header[6],
    pageBits = header[7];
  assert(pageBits >= 1 && pageBits <= 31, 'invalid fixed-array page bits');
  assert(
    hdf5Checksum(header.subarray(0, -4)) === number(header, headerLength - 4, 4),
    'fixed-array header checksum mismatch'
  );
  const entries = number(header, 8, lengthSize);
  assert(entries >= count && entries <= 10_000_000, 'invalid fixed-array entry count');
  const dataAddress = address(header, 8 + lengthSize, offsetSize);
  if (dataAddress === null) return [];
  const blockPrefixLength = 6 + offsetSize;
  const blockOffset = fileAddress(base, dataAddress);
  const blockPrefix = await source.read(blockOffset, blockPrefixLength, signal);
  assert(
    blockPrefix.length === blockPrefixLength &&
      String.fromCharCode(...blockPrefix.subarray(0, 4)) === 'FADB' &&
      blockPrefix[4] === 0 &&
      blockPrefix[5] === client &&
      readHDF5Unsigned(blockPrefix, 6, offsetSize) === layout.address,
    'invalid fixed-array data block'
  );
  assert(entries <= 2 ** pageBits, 'paged fixed arrays not yet supported');
  assert(
    client === 0 && entrySize === offsetSize,
    'filtered fixed-array records require separate qualification'
  );
  const payloadSize = entries * entrySize + 4;
  assert(payloadSize <= 128 * 1024 * 1024, 'fixed-array block too large');
  const payload = await source.read(blockOffset + blockPrefixLength, payloadSize, signal);
  assert(
    payload.length === payloadSize &&
      hdf5Checksum(Uint8Array.from([...blockPrefix, ...payload.subarray(0, -4)])) ===
        number(payload, payload.length - 4, 4),
    'fixed-array block checksum mismatch'
  );
  const resolved: HDF5ChunkEntry[] = [];
  for (let index = 0; index < count; index++) {
    const cursor = index * entrySize;
    const chunkAddress = address(payload, cursor, offsetSize);
    if (chunkAddress === null) continue;
    const sizeWidth = client === 0 ? 0 : entrySize - offsetSize - 4;
    const storedByteLength =
      client === 0 ? chunkBytes : number(payload, cursor + offsetSize, sizeWidth);
    const filterMask = client === 0 ? 0 : number(payload, cursor + offsetSize + sizeWidth, 4);
    resolved.push({
      origin: coordinates(index, counts, layout.chunkShape),
      address: base + chunkAddress,
      storedByteLength,
      filterMask
    });
  }
  return resolved;
}
