// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Header metadata shared by general and indexed archive writers. */
export interface ZipHeaderEntry {
  /** Encoded filename, at most 65535 bytes. */
  readonly nameBytes: Uint8Array;
  /** Encoded entry comment. */
  readonly commentBytes?: Uint8Array;
  /** UTC modification date. */
  readonly date: Date;
  /** STORE or DEFLATE method number. */
  readonly method: 0 | 8;
  /** General-purpose ZIP flags. */
  readonly flags: number;
  /** CRC-32 of decoded bytes. */
  readonly crc32: number;
  /** Decoded byte length. */
  readonly size: bigint;
  /** Encoded payload byte length. */
  readonly compressedSize: bigint;
  /** Absolute local-header offset. */
  readonly localHeaderOffset: bigint;
  /** Use ZIP64 size/offset fields. */
  readonly zip64: boolean;
  /** Set the DOS directory attribute. */
  readonly directory?: boolean;
}

/** Largest ZIP32 size/offset field; reserved for ZIP64 sentinels by this writer. */
const ZIP32_SENTINEL = 0xffffffffn;

/** Serializes an independent local header; descriptors carry unknown final sizes. */
export function encodeZipLocalHeader(entry: ZipHeaderEntry): Uint8Array<ArrayBuffer> {
  validateHeaderEntry(entry);
  const bytes = new Uint8Array(30 + entry.nameBytes.length + (entry.zip64 ? 20 : 0));
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, getZipVersion(entry), true);
  view.setUint16(6, entry.flags, true);
  view.setUint16(8, entry.method, true);
  view.setUint32(10, encodeZipTimestamp(entry.date), true);
  const descriptor = Boolean(entry.flags & 8);
  view.setUint32(14, descriptor ? 0 : entry.crc32, true);
  view.setUint32(
    18,
    entry.zip64 ? Number(ZIP32_SENTINEL) : descriptor ? 0 : Number(entry.compressedSize),
    true
  );
  view.setUint32(
    22,
    entry.zip64 ? Number(ZIP32_SENTINEL) : descriptor ? 0 : Number(entry.size),
    true
  );
  view.setUint16(26, entry.nameBytes.length, true);
  view.setUint16(28, entry.zip64 ? 20 : 0, true);
  bytes.set(entry.nameBytes, 30);
  if (entry.zip64) {
    const extraOffset = 30 + entry.nameBytes.length;
    view.setUint16(extraOffset, 1, true);
    view.setUint16(extraOffset + 2, 16, true);
    view.setBigUint64(extraOffset + 4, descriptor ? 0n : entry.size, true);
    view.setBigUint64(extraOffset + 12, descriptor ? 0n : entry.compressedSize, true);
  }
  return bytes;
}

/** Serializes a central record with final sizes, CRC and local-header offset. */
export function encodeZipCentralHeader(entry: ZipHeaderEntry): Uint8Array<ArrayBuffer> {
  validateHeaderEntry(entry);
  const comment = entry.commentBytes ?? new Uint8Array();
  const extraBytes = entry.zip64 ? 28 : 0;
  const bytes = new Uint8Array(46 + entry.nameBytes.length + extraBytes + comment.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, entry.zip64 ? 45 : 20, true);
  view.setUint16(6, getZipVersion(entry), true);
  view.setUint16(8, entry.flags, true);
  view.setUint16(10, entry.method, true);
  view.setUint32(12, encodeZipTimestamp(entry.date), true);
  view.setUint32(16, entry.crc32, true);
  view.setUint32(20, entry.zip64 ? Number(ZIP32_SENTINEL) : Number(entry.compressedSize), true);
  view.setUint32(24, entry.zip64 ? Number(ZIP32_SENTINEL) : Number(entry.size), true);
  view.setUint16(28, entry.nameBytes.length, true);
  view.setUint16(30, extraBytes, true);
  view.setUint16(32, comment.length, true);
  view.setUint32(38, entry.directory ? 16 : 0, true);
  view.setUint32(42, entry.zip64 ? Number(ZIP32_SENTINEL) : Number(entry.localHeaderOffset), true);
  bytes.set(entry.nameBytes, 46);
  if (entry.zip64) {
    const extraOffset = 46 + entry.nameBytes.length;
    view.setUint16(extraOffset, 1, true);
    view.setUint16(extraOffset + 2, 24, true);
    view.setBigUint64(extraOffset + 4, entry.size, true);
    view.setBigUint64(extraOffset + 12, entry.compressedSize, true);
    view.setBigUint64(extraOffset + 20, entry.localHeaderOffset, true);
  }
  bytes.set(comment, 46 + entry.nameBytes.length + extraBytes);
  return bytes;
}

/** Serializes a signed descriptor matching the local header's ZIP32/ZIP64 layout. */
export function encodeZipDescriptor(entry: ZipHeaderEntry): Uint8Array<ArrayBuffer> {
  validateHeaderEntry(entry);
  const bytes = new Uint8Array(entry.zip64 ? 24 : 16);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x08074b50, true);
  view.setUint32(4, entry.crc32, true);
  if (entry.zip64) {
    view.setBigUint64(8, entry.compressedSize, true);
    view.setBigUint64(16, entry.size, true);
  } else {
    view.setUint32(8, Number(entry.compressedSize), true);
    view.setUint32(12, Number(entry.size), true);
  }
  return bytes;
}

/** Serializes single-disk end records with bigint positions and an encoded archive comment. */
export function encodeZipEndRecords(
  count: bigint,
  directorySize: bigint,
  directoryOffset: bigint,
  zip64: boolean,
  comment = new Uint8Array()
): Uint8Array<ArrayBuffer> {
  for (const value of [count, directorySize, directoryOffset, directoryOffset + directorySize])
    validateUint64(value);
  if (comment.length > 0xffff) throw new RangeError('ZIP archive comment exceeds 65535 bytes');
  if (
    !zip64 &&
    (count > 0xffffn || directorySize >= ZIP32_SENTINEL || directoryOffset >= ZIP32_SENTINEL)
  )
    throw new RangeError('ZIP32 end record capacity exceeded');
  const bytes = new Uint8Array((zip64 ? 98 : 22) + comment.length);
  const view = new DataView(bytes.buffer);
  if (zip64) {
    view.setUint32(0, 0x06064b50, true);
    view.setBigUint64(4, 44n, true);
    view.setUint16(12, 45, true);
    view.setUint16(14, 45, true);
    view.setBigUint64(24, count, true);
    view.setBigUint64(32, count, true);
    view.setBigUint64(40, directorySize, true);
    view.setBigUint64(48, directoryOffset, true);
    view.setUint32(56, 0x07064b50, true);
    view.setBigUint64(64, directoryOffset + directorySize, true);
    view.setUint32(72, 1, true);
  }
  const endOffset = zip64 ? 76 : 0;
  view.setUint32(endOffset, 0x06054b50, true);
  view.setUint16(endOffset + 8, zip64 ? 0xffff : Number(count), true);
  view.setUint16(endOffset + 10, zip64 ? 0xffff : Number(count), true);
  view.setUint32(endOffset + 12, zip64 ? Number(ZIP32_SENTINEL) : Number(directorySize), true);
  view.setUint32(endOffset + 16, zip64 ? Number(ZIP32_SENTINEL) : Number(directoryOffset), true);
  view.setUint16(endOffset + 20, comment.length, true);
  bytes.set(comment, endOffset + 22);
  return bytes;
}

/** Encodes the UTC DOS time/date pair without depending on the host timezone. */
export function encodeZipTimestamp(date: Date): number {
  if (
    !(date instanceof Date) ||
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() < 1980 ||
    date.getUTCFullYear() > 2107
  )
    throw new RangeError('ZIP timestamp must be a valid UTC date in 1980–2107');
  const time =
    (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2);
  const day =
    ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  return ((day << 16) | time) >>> 0;
}

/** Selects the required extractor version for the encoded fields and method. */
function getZipVersion(entry: ZipHeaderEntry): number {
  return entry.zip64 ? 45 : entry.method === 8 || entry.flags & 8 ? 20 : 10;
}

/** Rejects overflow before DataView's setters can silently truncate values. */
function validateHeaderEntry(entry: ZipHeaderEntry): void {
  if (
    !entry.nameBytes.length ||
    entry.nameBytes.length > 0xffff ||
    (entry.commentBytes?.length ?? 0) > 0xffff
  )
    throw new RangeError('ZIP name/comment exceeds header capacity');
  for (const value of [entry.size, entry.compressedSize, entry.localHeaderOffset])
    validateUint64(value);
  if (
    !entry.zip64 &&
    [entry.size, entry.compressedSize, entry.localHeaderOffset].some(
      value => value >= ZIP32_SENTINEL
    )
  )
    throw new RangeError('ZIP32 entry capacity exceeded');
}

/** Validates an unsigned ZIP64 integer without converting through Number. */
function validateUint64(value: bigint): void {
  if (typeof value !== 'bigint' || value < 0n || value > 0xffffffffffffffffn)
    throw new RangeError('ZIP64 unsigned integer capacity exceeded');
}
