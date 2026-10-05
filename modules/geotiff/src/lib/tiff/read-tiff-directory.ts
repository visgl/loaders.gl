// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TiffContainer, TiffDirectory, TiffDirectoryLimits, TiffTagValue} from './tiff-types';

/** Byte sizes defined by TIFF 6.0 and the BigTIFF LONG8/SLONG8/IFD8 extension. */
const FIELD_BYTES: Readonly<Record<number, number>> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
  13: 4,
  16: 8,
  17: 8,
  18: 8
};

/** Rejects arithmetic that cannot identify an exact, contained byte range. */
export function checkTiffRange(offset: number, length: number, fileLength: number): void {
  if (
    ![offset, length].every(value => Number.isSafeInteger(value) && value >= 0) ||
    offset > fileLength ||
    length > fileLength - offset
  ) {
    throw new Error('TIFF byte range is unsafe or truncated');
  }
}

/** Converts an unsigned TIFF offset/count only when JavaScript can represent it exactly. */
export function readTiffOffset(
  view: DataView,
  offset: number,
  littleEndian: boolean,
  bigTiff: boolean
): number {
  const value = bigTiff
    ? view.getBigUint64(offset, littleEndian)
    : BigInt(view.getUint32(offset, littleEndian));
  if (value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('TIFF offset or count exceeds safe integer precision');
  return Number(value);
}

/** Reads original directory structures with bounded graph traversal and exact BigTIFF offsets. */
export function readTiffContainer(
  data: ArrayBuffer,
  limits: TiffDirectoryLimits = {}
): TiffContainer {
  const maxDirectories = limits.maxDirectories ?? 1024;
  const maxEntries = limits.maxEntriesPerDirectory ?? 4096;
  const maxBytes = limits.maxMetadataBytes ?? 16 * 1024 * 1024;
  if (
    ![maxDirectories, maxEntries, maxBytes].every(value => Number.isSafeInteger(value) && value > 0)
  ) {
    throw new Error('Invalid TIFF directory limits');
  }
  checkTiffRange(0, 8, data.byteLength);
  const view = new DataView(data);
  const marker = view.getUint16(0);
  if (marker !== 0x4949 && marker !== 0x4d4d) throw new Error('Invalid TIFF byte order');
  const littleEndian = marker === 0x4949;
  const version = view.getUint16(2, littleEndian);
  if (version !== 42 && version !== 43) throw new Error('Invalid TIFF version');
  const bigTiff = version === 43;
  checkTiffRange(0, bigTiff ? 16 : 8, data.byteLength);
  if (bigTiff && (view.getUint16(4, littleEndian) !== 8 || view.getUint16(6, littleEndian) !== 0)) {
    throw new Error('Invalid BigTIFF offset size or reserved field');
  }
  const firstOffset = readTiffOffset(view, bigTiff ? 8 : 4, littleEndian, bigTiff);
  const directoriesByOffset = new Map<number, TiffDirectory>();
  const activeOffsets = new Set<number>();
  let metadataBytes = bigTiff ? 16 : 8;
  /** Charges physical metadata bytes before decoding tag values or allocating directory state. */
  const chargeBytes = (length: number) => {
    if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes - metadataBytes) {
      throw new Error('TIFF metadata byte budget exceeded');
    }
    metadataBytes += length;
  };
  /** Reads and caches one checked directory; graph traversal is handled separately. */
  const readDirectory = (offset: number): TiffDirectory => {
    const cached = directoriesByOffset.get(offset);
    if (cached) return cached;
    if (directoriesByOffset.size >= maxDirectories)
      throw new Error('TIFF directory count budget exceeded');
    if (offset < (bigTiff ? 16 : 8) || offset % (bigTiff ? 8 : 2) !== 0) {
      throw new Error('Invalid TIFF directory offset or alignment');
    }
    const countBytes = bigTiff ? 8 : 2;
    const entryBytes = bigTiff ? 20 : 12;
    const inlineBytes = bigTiff ? 8 : 4;
    checkTiffRange(offset, countBytes, data.byteLength);
    const count = bigTiff
      ? readTiffOffset(view, offset, littleEndian, true)
      : view.getUint16(offset, littleEndian);
    if (count > maxEntries) throw new Error('TIFF directory entry budget exceeded');
    const directoryLength = countBytes + count * entryBytes + inlineBytes;
    checkTiffRange(offset, directoryLength, data.byteLength);
    chargeBytes(directoryLength);
    const tags = new Map<number, TiffTagValue>();
    for (let index = 0; index < count; index++) {
      const position = offset + countBytes + index * entryBytes;
      const tag = view.getUint16(position, littleEndian);
      const type = view.getUint16(position + 2, littleEndian);
      if (tags.has(tag)) throw new Error('Duplicate TIFF tag');
      const fieldBytes = FIELD_BYTES[type];
      if (!fieldBytes || (!bigTiff && type >= 16)) throw new Error('Unsupported TIFF field type');
      const valueCount = readTiffOffset(view, position + 4, littleEndian, bigTiff);
      const byteLength = valueCount * fieldBytes;
      if (!Number.isSafeInteger(byteLength)) throw new Error('Unsafe TIFF tag value size');
      const valuePosition = position + (bigTiff ? 12 : 8);
      const valueOffset =
        byteLength <= inlineBytes
          ? valuePosition
          : readTiffOffset(view, valuePosition, littleEndian, bigTiff);
      checkTiffRange(valueOffset, byteLength, data.byteLength);
      if (byteLength > inlineBytes) chargeBytes(byteLength);
      tags.set(tag, readTagValues(view, type, valueCount, valueOffset, littleEndian));
    }
    const nextOffset = readTiffOffset(
      view,
      offset + countBytes + count * entryBytes,
      littleEndian,
      bigTiff
    );
    const directory = {offset, nextOffset, tags};
    directoriesByOffset.set(offset, directory);
    return directory;
  };
  const directories: TiffDirectory[] = [];
  const mainOffsets = new Set<number>();
  let offset = firstOffset;
  while (offset) {
    if (mainOffsets.has(offset)) throw new Error('Cyclic TIFF directory chain');
    mainOffsets.add(offset);
    const directory = readDirectory(offset);
    directories.push(directory);
    offset = directory.nextOffset;
  }
  if (!directories.length) throw new Error('TIFF has no image directories');
  // Each DFS frame holds an index rather than an expanded child list, so pending traversal is bounded by directory count.
  const finishedOffsets = new Set<number>();
  for (const root of directories) {
    const stack = [{directory: root, childIndex: 0}];
    while (stack.length) {
      const entry = stack[stack.length - 1];
      const subOffsets = entry.directory.tags.get(330);
      if (subOffsets !== undefined && !Array.isArray(subOffsets))
        throw new Error('Invalid TIFF SubIFD offsets');
      if (entry.childIndex === 0) {
        if (finishedOffsets.has(entry.directory.offset)) {
          stack.pop();
          continue;
        }
        activeOffsets.add(entry.directory.offset);
      }
      const subCount = subOffsets?.length ?? 0;
      const childCount = subCount + (entry.directory.nextOffset ? 1 : 0);
      if (entry.childIndex >= childCount) {
        activeOffsets.delete(entry.directory.offset);
        finishedOffsets.add(entry.directory.offset);
        stack.pop();
        continue;
      }
      const subOffset =
        entry.childIndex < subCount ? subOffsets![entry.childIndex] : entry.directory.nextOffset;
      entry.childIndex++;
      const childOffset = Number(subOffset);
      if (
        !Number.isSafeInteger(childOffset) ||
        childOffset <= 0 ||
        BigInt(childOffset) !== BigInt(subOffset)
      )
        throw new Error('Unsafe TIFF SubIFD offset');
      if (activeOffsets.has(childOffset)) throw new Error('Cyclic TIFF SubIFD graph');
      if (!finishedOffsets.has(childOffset))
        stack.push({directory: readDirectory(childOffset), childIndex: 0});
    }
  }
  return {littleEndian, bigTiff, directories, directoriesByOffset};
}

/** Decodes TIFF field values without truncating 64-bit integers or coercing binary data to strings. */
function readTagValues(
  view: DataView,
  type: number,
  count: number,
  offset: number,
  littleEndian: boolean
): TiffTagValue {
  if (type === 2) {
    const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, count);
    let text = '';
    for (let position = 0; position < bytes.length; position += 16384)
      text += String.fromCharCode(...bytes.subarray(position, position + 16384));
    return text.replace(/\0+$/, '');
  }
  if (type === 16 || type === 17 || type === 18) {
    return Array.from({length: count}, (_, index) =>
      type === 17
        ? view.getBigInt64(offset + index * 8, littleEndian)
        : view.getBigUint64(offset + index * 8, littleEndian)
    );
  }
  return Array.from({length: count}, (_, index) => {
    const position = offset + index * FIELD_BYTES[type];
    switch (type) {
      case 1:
      case 7:
        return view.getUint8(position);
      case 6:
        return view.getInt8(position);
      case 3:
        return view.getUint16(position, littleEndian);
      case 8:
        return view.getInt16(position, littleEndian);
      case 4:
      case 13:
        return view.getUint32(position, littleEndian);
      case 9:
        return view.getInt32(position, littleEndian);
      case 11:
        return view.getFloat32(position, littleEndian);
      case 12:
        return view.getFloat64(position, littleEndian);
      case 5:
        return view.getUint32(position, littleEndian) / view.getUint32(position + 4, littleEndian);
      case 10:
        return view.getInt32(position, littleEndian) / view.getInt32(position + 4, littleEndian);
      default:
        throw new Error('Unsupported TIFF field type');
    }
  });
}
