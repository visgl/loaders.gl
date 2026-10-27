// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import {TarFormat} from './tar-format';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const BLOCK_SIZE = 512;
const encoder = new TextEncoder();

/** Named files to encode as an uncompressed TAR archive. A trailing slash denotes a directory. */
export type TarWriterFiles = Readonly<Record<string, string | ArrayBuffer | Uint8Array>>;

/** Encodes an unsigned octal value into a fixed-width TAR header field. */
function writeOctal(header: Uint8Array, offset: number, width: number, value: number): void {
  const digits = value.toString(8);
  if (!Number.isSafeInteger(value) || value < 0 || digits.length > width - 1) {
    throw new RangeError('TAR numeric field exceeds header capacity');
  }
  header.set(encoder.encode(digits.padStart(width - 1, '0')), offset);
  header[offset + width - 1] = 0;
}

/** Splits a UTF-8 path at a slash for the ustar name and prefix fields. */
function splitPath(path: string): {name: Uint8Array; prefix: Uint8Array} {
  const components = path.split('/').filter(part => part && part !== '.');
  if (
    !path ||
    path.startsWith('/') ||
    path.includes('\\') ||
    path.includes('\0') ||
    /^[A-Za-z]:/.test(components[0] ?? '') ||
    components.includes('..')
  ) {
    throw new Error(`Unsafe TAR path: ${path}`);
  }
  const bytes = encoder.encode(path);
  if (bytes.length <= 100) return {name: bytes, prefix: new Uint8Array(0)};
  for (let index = path.lastIndexOf('/'); index > 0; index = path.lastIndexOf('/', index - 1)) {
    const prefix = encoder.encode(path.slice(0, index));
    const name = encoder.encode(path.slice(index + 1));
    if (prefix.length <= 155 && name.length > 0 && name.length <= 100) return {name, prefix};
  }
  throw new RangeError(`TAR path exceeds ustar header capacity: ${path}`);
}

/** Encodes named files with UTF-8 ustar names and deterministic metadata. */
export async function encodeTar(files: TarWriterFiles): Promise<ArrayBuffer> {
  const entries = Object.keys(files)
    .sort()
    .map(path => [path, files[path]] as const);
  const prepared = entries.map(([path, value]) => {
    const directory = path.endsWith('/');
    const bytes =
      typeof value === 'string'
        ? encoder.encode(value)
        : value instanceof Uint8Array
          ? value
          : new Uint8Array(value);
    if (directory && bytes.length) throw new Error(`TAR directory has file data: ${path}`);
    return {path, directory, bytes, ...splitPath(path)};
  });
  let length = BLOCK_SIZE * 2;
  for (const entry of prepared) {
    length += BLOCK_SIZE + Math.ceil(entry.bytes.length / BLOCK_SIZE) * BLOCK_SIZE;
    if (!Number.isSafeInteger(length)) throw new RangeError('TAR archive exceeds safe size');
  }
  const archive = new Uint8Array(length);
  let offset = 0;
  for (const entry of prepared) {
    const header = archive.subarray(offset, offset + BLOCK_SIZE);
    header.set(entry.name, 0);
    writeOctal(header, 100, 8, entry.directory ? 0o755 : 0o644);
    writeOctal(header, 108, 8, 0);
    writeOctal(header, 116, 8, 0);
    writeOctal(header, 124, 12, entry.bytes.length);
    writeOctal(header, 136, 12, 0);
    header.fill(32, 148, 156);
    header[156] = entry.directory ? 53 : 48;
    header.set(encoder.encode('ustar\0'), 257);
    header.set(encoder.encode('00'), 263);
    header.set(entry.prefix, 345);
    let checksum = 0;
    for (const byte of header) checksum += byte;
    header.set(encoder.encode(checksum.toString(8).padStart(6, '0') + '\0 '), 148);
    offset += BLOCK_SIZE;
    archive.set(entry.bytes, offset);
    offset += Math.ceil(entry.bytes.length / BLOCK_SIZE) * BLOCK_SIZE;
  }
  return archive.buffer;
}

/** Buffered UTF-8 ustar writer. */
export const TarWriter = {
  ...TarFormat,
  version: VERSION,
  options: {},
  encode: async (files: TarWriterFiles, _options?: WriterOptions): Promise<ArrayBuffer> =>
    encodeTar(files)
} as const satisfies WriterWithEncoder<TarWriterFiles, never, WriterOptions>;
