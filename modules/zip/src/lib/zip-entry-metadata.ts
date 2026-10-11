// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CRC32Hash} from '@loaders.gl/crypto';
import {parseZip64ExtraField} from '../parse-zip/zip64-extra-field';
import type {Zip64ExtraFieldDescription} from '../parse-zip/zip64-extra-field';

/** DOS CP437 characters for bytes 128–255; ASCII/control bytes retain their code points. */
const CP437_HIGH =
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';

/** Header fields required by the common ZIP container reader. */
export interface ZipHeaderMetadata {
  /** Decoded canonical relative path. */
  readonly path: string;
  /** Original filename bytes, used for local/central consistency. */
  readonly nameBytes: Uint8Array;
  /** General-purpose flags. */
  readonly flags: number;
  /** Compression method number. */
  readonly method: number;
  /** Expected payload CRC-32. */
  readonly crc32: number;
  /** Compressed length. */
  readonly compressedSize: bigint;
  /** Decoded length. */
  readonly size: bigint;
  /** Central local-header pointer; zero for a local header. */
  readonly localHeaderOffset: bigint;
  /** Decoded central comment. */
  readonly comment: string;
  /** Whether local size fields use ZIP64. */
  readonly zip64: boolean;
}

/** Decodes common ZIP headers using shared ZIP64 extra-field parsing. */
export function decodeZipHeader(bytes: Uint8Array, central: boolean): ZipHeaderMetadata {
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const fixedBytes = central ? 46 : 30;
  if (
    bytes.byteLength < fixedBytes ||
    header.getUint32(0, true) !== (central ? 0x02014b50 : 0x04034b50)
  )
    throw new Error('Invalid ZIP archive: missing entry header');
  const nameLength = header.getUint16(central ? 28 : 26, true);
  const extraLength = header.getUint16(central ? 30 : 28, true);
  const commentLength = central ? header.getUint16(32, true) : 0;
  if (bytes.byteLength !== fixedBytes + nameLength + extraLength + commentLength)
    throw new Error('Invalid ZIP archive: truncated entry metadata');
  const flags = header.getUint16(central ? 8 : 6, true);
  const method = header.getUint16(central ? 10 : 8, true);
  if (flags & (1 | 0x40 | 0x2000)) throw new Error('Unsupported ZIP encryption');
  if (flags & ~(8 | 0x800 | (method === 8 ? 6 : 0))) throw new Error('Unsupported ZIP flags');
  if (method !== 0 && method !== 8)
    throw new Error(`Unsupported ZIP compression method: ${method}`);
  let compressedSize = BigInt(header.getUint32(central ? 20 : 18, true));
  let size = BigInt(header.getUint32(central ? 24 : 22, true));
  let localHeaderOffset = central ? BigInt(header.getUint32(42, true)) : 0n;
  let disk = central ? BigInt(header.getUint16(34, true)) : 0n;
  let zip64 = compressedSize === 0xffffffffn || size === 0xffffffffn;
  const fields: Zip64ExtraFieldDescription<
    'size' | 'compressedSize' | 'localHeaderOffset' | 'disk'
  >[] = [];
  if (central) {
    if (size === 0xffffffffn) fields.push({name: 'size', byteLength: 8});
    if (compressedSize === 0xffffffffn) fields.push({name: 'compressedSize', byteLength: 8});
    if (localHeaderOffset === 0xffffffffn) fields.push({name: 'localHeaderOffset', byteLength: 8});
    if (disk === 0xffffn) fields.push({name: 'disk', byteLength: 4});
  } else if (zip64)
    fields.push({name: 'size', byteLength: 8}, {name: 'compressedSize', byteLength: 8});
  const extraBytes = bytes.subarray(fixedBytes + nameLength, fixedBytes + nameLength + extraLength);
  const extra = new DataView(extraBytes.buffer, extraBytes.byteOffset, extraBytes.byteLength);
  const extraValues = parseZip64ExtraField(extra, fields);
  if (size === 0xffffffffn) size = extraValues.size!;
  if (compressedSize === 0xffffffffn) compressedSize = extraValues.compressedSize!;
  if (localHeaderOffset === 0xffffffffn) localHeaderOffset = extraValues.localHeaderOffset!;
  if (disk === 0xffffn) disk = extraValues.disk!;
  if (disk !== 0n) throw new Error('Unsupported split ZIP archive');
  const nameBytes = bytes.subarray(fixedBytes, fixedBytes + nameLength);
  let path = decodeZipText(nameBytes, Boolean(flags & 0x800));
  const commentBytes = bytes.subarray(fixedBytes + nameLength + extraLength);
  let comment = decodeZipText(commentBytes, Boolean(flags & 0x800));
  for (let offset = 0; offset < extra.byteLength; ) {
    if (offset + 4 > extra.byteLength)
      throw new Error('Invalid ZIP archive: truncated extra field');
    const identifier = extra.getUint16(offset, true);
    const length = extra.getUint16(offset + 2, true);
    if (offset + 4 + length > extra.byteLength)
      throw new Error('Invalid ZIP archive: truncated extra field');
    // Nonseekable Python ZIP64 output can retain zero legacy sizes and indicate the
    // descriptor width only through its local ZIP64 extra record.
    if (!central && flags & 8 && identifier === 1) {
      if (length >= 16) zip64 = true;
    }
    if (identifier === 0x7075 || identifier === 0x6375) {
      const original = identifier === 0x7075 ? nameBytes : commentBytes;
      if (length < 5) throw new Error('Invalid ZIP archive: truncated Unicode extra field');
      if (
        extra.getUint8(offset + 4) === 1 &&
        extra.getUint32(offset + 5, true) === calculateZipChecksum(original)
      ) {
        const text = decodeZipText(extraBytes.subarray(offset + 9, offset + 4 + length), true);
        if (identifier === 0x7075) path = text;
        else comment = text;
      }
    }
    offset += 4 + length;
  }
  validateZipPath(path);
  return {
    path,
    nameBytes,
    flags,
    method,
    crc32: header.getUint32(central ? 16 : 14, true),
    compressedSize,
    size,
    localHeaderOffset,
    comment,
    zip64
  };
}

/** Decodes UTF-8 strictly or the ZIP legacy CP437 character set. */
export function decodeZipText(bytes: Uint8Array, utf8: boolean): string {
  if (utf8) return new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes);
  return Array.from(bytes, value =>
    value < 128 ? String.fromCharCode(value) : CP437_HIGH[value - 128]
  ).join('');
}

/** Validates archive-relative paths without silently rewriting their identity. */
export function validateZipPath(path: string): void {
  const segments = path.endsWith('/') ? path.slice(0, -1).split('/') : path.split('/');
  if (
    !path ||
    path.includes('\\') ||
    path.includes('\0') ||
    /^[A-Za-z]:/.test(path) ||
    segments.some(segment => !segment || segment === '.' || segment === '..')
  )
    throw new Error('Invalid ZIP archive: noncanonical relative path');
}

/** Uses the shared CRC implementation for small filename/metadata checks. */
export function calculateZipChecksum(bytes: Uint8Array): number {
  return Number.parseInt(new CRC32Hash().hashSync(bytes.slice().buffer, 'hex'), 16);
}
