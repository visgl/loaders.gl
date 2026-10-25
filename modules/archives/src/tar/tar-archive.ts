// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TarFileMap, TarLoaderOptions} from './tar-loader-types';

const BLOCK_SIZE = 512;
const decoder = new TextDecoder();

/** Reads a null-terminated UTF-8 field from a TAR header. */
function readString(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return decoder.decode(end === -1 ? bytes : bytes.subarray(0, end));
}

/** Reads an unsigned octal field, rejecting malformed and unsafe values. */
function readOctal(bytes: Uint8Array): number {
  const value = readString(bytes).trim();
  if (!value || !/^[0-7]+$/.test(value)) throw new Error('Invalid TAR numeric field');
  const number = Number.parseInt(value, 8);
  if (!Number.isSafeInteger(number)) throw new RangeError('TAR numeric field exceeds safe range');
  return number;
}

/** Rejects paths that could escape an extraction root. */
function validatePath(path: string): void {
  if (
    !path ||
    path.startsWith('/') ||
    path.includes('\\') ||
    path.includes('\0') ||
    path.split('/').some(part => part === '..' || part === '.')
  ) {
    throw new Error(`Unsafe TAR path: ${path}`);
  }
}

/** Decode regular files in a TAR archive, validating headers and allocation limits. */
export function readTarArchive(
  input: ArrayBuffer | ArrayBufferView,
  options: TarLoaderOptions = {}
): TarFileMap {
  const bytes =
    input instanceof ArrayBuffer
      ? new Uint8Array(input)
      : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  const maxEntries = options.tar?.maxEntries ?? 100000;
  const maxBytes = options.tar?.maxTotalDecodedBytes ?? 64 * 1024 * 1024;
  if (
    !Number.isSafeInteger(maxEntries) ||
    maxEntries < 0 ||
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 0
  ) {
    throw new RangeError('Invalid TAR limits');
  }
  const files: TarFileMap = Object.create(null);
  let offset = 0;
  let entries = 0;
  let totalBytes = 0;
  while (offset + BLOCK_SIZE <= bytes.length) {
    const header = bytes.subarray(offset, offset + BLOCK_SIZE);
    if (header.every(byte => byte === 0)) return files;
    const storedChecksum = readOctal(header.subarray(148, 156));
    let checksum = 0;
    for (let index = 0; index < BLOCK_SIZE; index++) {
      checksum += index >= 148 && index < 156 ? 32 : header[index];
    }
    if (checksum !== storedChecksum) throw new Error('Invalid TAR header checksum');
    if (++entries > maxEntries) throw new RangeError('TAR entry limit exceeded');
    const name = readString(header.subarray(0, 100));
    const prefix = readString(header.subarray(345, 500));
    const path = prefix ? `${prefix}/${name}` : name;
    validatePath(path);
    const size = readOctal(header.subarray(124, 136));
    const dataOffset = offset + BLOCK_SIZE;
    if (size > bytes.length - dataOffset) throw new Error('Truncated TAR entry');
    const type = header[156];
    if (type === 0 || type === 48) {
      totalBytes += size;
      if (totalBytes > maxBytes) throw new RangeError('TAR decoded-byte limit exceeded');
      if (Object.hasOwn(files, path)) throw new Error(`Duplicate TAR path: ${path}`);
      files[path] = bytes.slice(dataOffset, dataOffset + size).buffer;
    } else if (type !== 53) {
      throw new Error(`Unsupported TAR entry type: ${String.fromCharCode(type)}`);
    }
    offset = dataOffset + Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE;
  }
  throw new Error('Truncated TAR archive');
}
