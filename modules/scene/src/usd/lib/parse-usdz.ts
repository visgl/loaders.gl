// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_FILE_HEADER = 0x04034b50;

/** Extracts stored files from an uncompressed USDZ ZIP archive. */
export function parseUSDZArchive(arrayBuffer: ArrayBuffer): Map<string, ArrayBuffer> {
  const view = new DataView(arrayBuffer);
  const directoryOffset = findCentralDirectory(view);
  const entryCount = view.getUint16(directoryOffset + 10, true);
  let entryOffset = view.getUint32(directoryOffset + 16, true);
  const dataLimit = entryOffset;
  const files = new Map<string, ArrayBuffer>();
  const textDecoder = new TextDecoder();
  let extractedByteLength = 0;

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
    if (entryOffset + 46 > directoryOffset) {
      throw new Error('USDZ archive contains a truncated ZIP central-directory entry.');
    }
    if (view.getUint32(entryOffset, true) !== CENTRAL_DIRECTORY_ENTRY) {
      throw new Error('USDZ archive contains an invalid ZIP central-directory entry.');
    }

    const compression = view.getUint16(entryOffset + 10, true);
    const compressedLength = view.getUint32(entryOffset + 20, true);
    const uncompressedLength = view.getUint32(entryOffset + 24, true);
    const filenameLength = view.getUint16(entryOffset + 28, true);
    const extraLength = view.getUint16(entryOffset + 30, true);
    const commentLength = view.getUint16(entryOffset + 32, true);
    const localOffset = view.getUint32(entryOffset + 42, true);
    if (entryOffset + 46 + filenameLength + extraLength + commentLength > directoryOffset) {
      throw new Error('USDZ archive contains a truncated ZIP filename or extra field.');
    }
    const filename = textDecoder.decode(
      new Uint8Array(arrayBuffer, entryOffset + 46, filenameLength)
    );

    if (compression !== 0) {
      throw new Error(`USDZ entry "${filename}" is compressed; USDZ requires stored ZIP entries.`);
    }
    if (localOffset + 30 > dataLimit || compressedLength !== uncompressedLength) {
      throw new Error(`USDZ entry "${filename}" has invalid stored ZIP bounds.`);
    }
    if (view.getUint32(localOffset, true) !== LOCAL_FILE_HEADER) {
      throw new Error(`USDZ entry "${filename}" has an invalid local ZIP header.`);
    }

    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const contentOffset = localOffset + 30 + localNameLength + localExtraLength;
    if ((view.getUint16(entryOffset + 8, true) | view.getUint16(localOffset + 6, true)) & 1) {
      throw new Error(`USDZ entry "${filename}" is encrypted.`);
    }
    if (
      contentOffset + compressedLength > dataLimit ||
      view.getUint16(localOffset + 8, true) !== 0 ||
      textDecoder.decode(new Uint8Array(arrayBuffer, localOffset + 30, localNameLength)) !==
        filename ||
      files.has(filename)
    ) {
      throw new Error(`USDZ entry "${filename}" has invalid or duplicate stored ZIP data.`);
    }
    extractedByteLength += compressedLength;
    if (extractedByteLength > arrayBuffer.byteLength) {
      throw new Error('USDZ archive exceeds its stored data budget.');
    }
    files.set(filename, arrayBuffer.slice(contentOffset, contentOffset + compressedLength));
    entryOffset += 46 + filenameLength + extraLength + commentLength;
  }

  return files;
}

/** Finds the ZIP end-of-central-directory record. */
function findCentralDirectory(view: DataView): number {
  const minimumOffset = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= minimumOffset; offset--) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY) {
      return offset;
    }
  }
  throw new Error('USDZ archive does not contain a ZIP end-of-central-directory record.');
}
