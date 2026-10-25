// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {HDF5ByteSource, HDF5Superblock} from './hdf5-binary';
import {readHDF5Unsigned} from './hdf5-dataset-messages';

export type HDF5ObjectMessage = {
  type: number;
  flags: number;
  payload: Uint8Array;
};
export type HDF5ObjectHeader = {
  version: 2;
  flags: number;
  messages: readonly HDF5ObjectMessage[];
};

function safeOffset(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('HDF5: object address exceeds safe JS range');
  }
  return Number(value);
}
function unsigned(data: Uint8Array, start: number, size: number): number {
  if (start + size > data.length) throw new Error('HDF5: truncated object header');
  let n = 0;
  for (let i = size - 1; i >= 0; i--) n = n * 256 + data[start + i];
  if (!Number.isSafeInteger(n)) throw new Error('HDF5: unsafe object-header length');
  return n;
}

/**
 * Read v2 object header and its continuation message chunks.
 * Bounds traversal and reject shared messages until shared-message resolution exists.
 */
export async function readHDF5ObjectHeader(
  source: HDF5ByteSource,
  superblock: HDF5Superblock,
  objectAddress: bigint,
  signal?: AbortSignal
): Promise<HDF5ObjectHeader> {
  const offset = safeOffset(superblock.baseAddress + objectAddress);
  const prefix = await source.read(offset, 32, signal);
  if (prefix.length < 6 || String.fromCharCode(...prefix.subarray(0, 4)) !== 'OHDR') {
    throw new Error('HDF5: expected v2 object header (OHDR)');
  }
  if (prefix[4] !== 2) throw new Error('HDF5: unsupported object-header version');
  const flags = prefix[5];
  let cursor = 6;
  if (flags & 0x20) cursor += 16;
  if (flags & 0x10) cursor += 4;
  const sizeBytes = 1 << (flags & 3);
  const chunkLength = unsigned(prefix, cursor, sizeBytes);
  cursor += sizeBytes;
  if (chunkLength > 64 * 1024 * 1024) throw new Error('HDF5: oversized object header');
  const chunk = await source.read(offset + cursor, chunkLength, signal);
  if (chunk.length !== chunkLength) throw new Error('HDF5: truncated message chunk');

  const messages: HDF5ObjectMessage[] = [];
  const continuations: {address: bigint; length: number}[] = [];
  const visited = new Set<string>();
  let totalBytes = chunk.length;

  const parseMessages = (bytes: Uint8Array): void => {
    let i = 0;
    const headerSize = flags & 4 ? 6 : 4;
    while (i + headerSize <= bytes.length) {
      const type = bytes[i];
      const length = unsigned(bytes, i + 1, 2);
      const messageFlags = bytes[i + 3];
      i += headerSize;
      if (type === 0 && length === 0) break;
      if (i + length > bytes.length) throw new Error('HDF5: truncated object message');
      const payload = bytes.slice(i, i + length);
      i += length;
      if (messageFlags & 2) throw new Error('HDF5: shared object messages not yet supported');
      if (type === 0x10) {
        const expected = superblock.offsetSize + superblock.lengthSize;
        if (payload.length !== expected) throw new Error('HDF5: malformed continuation message');
        const address = readHDF5Unsigned(payload, 0, superblock.offsetSize);
        const size = readHDF5Unsigned(payload, superblock.offsetSize, superblock.lengthSize);
        if (size < 8n || size > 64n * 1024n * 1024n) {
          throw new Error('HDF5: invalid continuation length');
        }
        continuations.push({address, length: Number(size)});
      } else {
        messages.push({type, flags: messageFlags, payload});
      }
      if (messages.length + continuations.length > 100000) {
        throw new Error('HDF5: excessive object messages');
      }
    }
  };
  parseMessages(chunk);
  for (let index = 0; index < continuations.length; index++) {
    if (index >= 256) throw new Error('HDF5: excessive continuation chunks');
    const continuation = continuations[index];
    const key = continuation.address.toString();
    if (visited.has(key)) throw new Error('HDF5: cyclic continuation reference');
    visited.add(key);
    totalBytes += continuation.length;
    if (totalBytes > 128 * 1024 * 1024) throw new Error('HDF5: continuation budget exceeded');
    const bytes = await source.read(
      safeOffset(superblock.baseAddress + continuation.address),
      continuation.length,
      signal
    );
    if (
      bytes.length !== continuation.length ||
      String.fromCharCode(...bytes.subarray(0, 4)) !== 'OCHK'
    ) {
      throw new Error('HDF5: invalid continuation chunk');
    }
    // Continuation chunk includes OCHK signature and a trailing checksum.
    parseMessages(bytes.subarray(4, bytes.length - 4));
  }
  return {version: 2, flags, messages};
}
