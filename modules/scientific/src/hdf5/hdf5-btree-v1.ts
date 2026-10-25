// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {HDF5ByteSource, HDF5Superblock} from './hdf5-binary';
import type {HDF5ChunkEntry} from './hdf5-chunk-reader';
import {readHDF5Unsigned} from './hdf5-dataset-messages';

/**
 * HDF5 v1 B-tree chunk index (TREE, node type 1).
 * Supports fixed-size chunk records, including filter masks.
 * Chunk coordinates in v1 keys are BYTE-independent logical offsets.
 */
export async function readHDF5ChunkBTreeV1(
  source: HDF5ByteSource,
  superblock: HDF5Superblock,
  rootAddress: bigint,
  shape: readonly number[],
  chunkShape: readonly number[],
  options: {signal?: AbortSignal; maxNodes?: number} = {}
): Promise<HDF5ChunkEntry[]> {
  const {offsetSize, baseAddress} = superblock;
  const rank = shape.length;
  if (
    !rank ||
    rank !== chunkShape.length ||
    rank > 32 ||
    shape.some(
      (n, i) =>
        !Number.isSafeInteger(n) ||
        n <= 0 ||
        !Number.isSafeInteger(chunkShape[i]) ||
        chunkShape[i] <= 0
    )
  ) {
    throw new Error('HDF5: invalid v1 B-tree dataset dimensions');
  }
  const maxNodes = options.maxNodes ?? 100000;
  const seen = new Set<string>();
  const entries: HDF5ChunkEntry[] = [];
  const keyLength = 8 + (rank + 1) * 8;
  const headerLength = 8 + offsetSize * 2;
  const keyAt = (bytes: Uint8Array, offset: number) => {
    if (offset + keyLength > bytes.length) throw new Error('HDF5: truncated v1 chunk key');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const size = view.getUint32(offset, true);
    const mask = view.getUint32(offset + 4, true);
    const coordinates: number[] = [];
    for (let axis = 0; axis < rank + 1; axis++) {
      const value = readHDF5Unsigned(bytes, offset + 8 + axis * 8, 8);
      if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('HDF5: unsafe chunk coordinate');
      coordinates.push(Number(value));
    }
    return {size, mask, coordinates};
  };
  const safeAddress = (relative: bigint): number => {
    const absolute = baseAddress + relative;
    if (absolute < 0n || absolute > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('HDF5: unsafe B-tree address');
    }
    return Number(absolute);
  };
  const visit = async (address: bigint, depth: number): Promise<void> => {
    if (depth > 32 || seen.size >= maxNodes) throw new Error('HDF5: B-tree traversal limit');
    const key = address.toString();
    if (seen.has(key)) throw new Error('HDF5: B-tree cycle or duplicate node');
    seen.add(key);
    const prefix = await source.read(safeAddress(address), headerLength, options.signal);
    if (
      prefix.length !== headerLength ||
      String.fromCharCode(...prefix.subarray(0, 4)) !== 'TREE' ||
      prefix[4] !== 1
    ) {
      throw new Error('HDF5: invalid v1 chunk B-tree node');
    }
    const level = prefix[5];
    const count = prefix[6] | (prefix[7] << 8);
    if (count > 4096) throw new Error('HDF5: oversized v1 B-tree node');
    const bytesNeeded = (count + 1) * keyLength + count * offsetSize;
    if (bytesNeeded > 1024 * 1024) throw new Error('HDF5: oversized v1 B-tree payload');
    const bytes = await source.read(
      safeAddress(address) + headerLength,
      bytesNeeded,
      options.signal
    );
    if (bytes.length !== bytesNeeded) throw new Error('HDF5: truncated v1 B-tree node');
    let cursor = 0;
    let previous = keyAt(bytes, cursor);
    cursor += keyLength;
    for (let i = 0; i < count; i++) {
      const child = readHDF5Unsigned(bytes, cursor, offsetSize);
      cursor += offsetSize;
      const next = keyAt(bytes, cursor);
      cursor += keyLength;
      if (level === 0) {
        const origin = previous.coordinates.slice(0, rank);
        if (origin.some((value, axis) => value >= shape[axis] || value % chunkShape[axis] !== 0)) {
          throw new Error('HDF5: invalid v1 B-tree chunk origin');
        }
        if (previous.size > 0) {
          entries.push({
            origin,
            address: baseAddress + child,
            storedByteLength: previous.size,
            filterMask: previous.mask
          });
        }
      } else {
        await visit(child, depth + 1);
      }
      previous = next;
    }
  };
  await visit(rootAddress, 0);
  const coordinates = new Set<string>();
  for (const entry of entries) {
    const key = entry.origin.join(',');
    if (coordinates.has(key)) throw new Error('HDF5: duplicate v1 B-tree chunk');
    coordinates.add(key);
  }
  return entries;
}
