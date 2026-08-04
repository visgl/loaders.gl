// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {compareArrayBuffers, concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import {parseEoCDRecord} from './end-of-central-directory';
import {ZipSignature} from './search-from-the-end';
import {createZip64Info, setFieldToNumber} from './zip64-info-generation';
import {
  parseZip64ExtraField,
  ZIP64_UINT16_SENTINEL,
  ZIP64_UINT32_SENTINEL,
  type Zip64ExtraFieldDescription
} from './zip64-extra-field';
import {
  DataViewReadableFile,
  getReadableFileSize,
  readDataView,
  readRange
} from './readable-file-utils';

/**
 * zip central directory file header info
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipCDFileHeader = {
  /** Compressed size */
  compressedSize: bigint;
  /** Uncompressed size */
  uncompressedSize: bigint;
  /** Extra field size */
  extraFieldLength: number;
  /** File name length */
  fileNameLength: number;
  /** File name */
  fileName: string;
  /** Extra field offset */
  extraOffset: bigint;
  /** Relative offset of local file header */
  localHeaderOffset: bigint;
  /** Number of the disk where the file starts */
  startDisk: bigint;
};

/**
 * Data that might be in ZIP64 notation inside extra data
 */
type Zip64CentralDirectoryData = {
  /** Uncompressed size */
  uncompressedSize: bigint;
  /** Compressed size */
  compressedSize: bigint;
  /** Relative offset of local file header */
  localHeaderOffset: bigint;
  /** Start disk */
  startDisk: bigint;
};

// offsets accroding to https://en.wikipedia.org/wiki/ZIP_(file_format)
const CD_COMPRESSED_SIZE_OFFSET = 20;
const CD_UNCOMPRESSED_SIZE_OFFSET = 24;
const CD_FILE_NAME_LENGTH_OFFSET = 28;
const CD_EXTRA_FIELD_LENGTH_OFFSET = 30;
const CD_START_DISK_OFFSET = 34;
const CD_LOCAL_HEADER_OFFSET_OFFSET = 42;
const CD_FILE_NAME_OFFSET = 46n;

export const signature: ZipSignature = new Uint8Array([0x50, 0x4b, 0x01, 0x02]);

/**
 * Parses central directory file header of zip file
 * @param headerOffset - offset in the archive where header starts
 * @param file - readable file containing the archive
 * @returns Info from the header
 */
export const parseZipCDFileHeader = async (
  headerOffset: bigint,
  file: ReadableFile
): Promise<ZipCDFileHeader | null> => {
  const fileLength = await getReadableFileSize(file);
  if (headerOffset >= fileLength) {
    return null;
  }
  const mainHeader = await readDataView(file, headerOffset, headerOffset + CD_FILE_NAME_OFFSET);

  const magicBytes = mainHeader.buffer.slice(0, 4);
  if (!compareArrayBuffers(magicBytes, signature.buffer)) {
    return null;
  }

  const compressedSize = BigInt(mainHeader.getUint32(CD_COMPRESSED_SIZE_OFFSET, true));
  const uncompressedSize = BigInt(mainHeader.getUint32(CD_UNCOMPRESSED_SIZE_OFFSET, true));
  const extraFieldLength = mainHeader.getUint16(CD_EXTRA_FIELD_LENGTH_OFFSET, true);
  const startDisk = BigInt(mainHeader.getUint16(CD_START_DISK_OFFSET, true));
  const fileNameLength = mainHeader.getUint16(CD_FILE_NAME_LENGTH_OFFSET, true);

  const additionalHeader = await readRange(
    file,
    headerOffset + CD_FILE_NAME_OFFSET,
    headerOffset + CD_FILE_NAME_OFFSET + BigInt(fileNameLength + extraFieldLength)
  );

  const filenameBytes = additionalHeader.slice(0, fileNameLength);
  const fileName = new TextDecoder().decode(filenameBytes);

  const extraOffset = headerOffset + CD_FILE_NAME_OFFSET + BigInt(fileNameLength);
  const oldFormatOffset = mainHeader.getUint32(CD_LOCAL_HEADER_OFFSET_OFFSET, true);

  const localHeaderOffset = BigInt(oldFormatOffset);
  const extraField = new DataView(
    additionalHeader.slice(fileNameLength, additionalHeader.byteLength)
  );
  // looking for info that might be also be in zip64 extra field

  const zip64Data: Zip64CentralDirectoryData = {
    uncompressedSize,
    compressedSize,
    localHeaderOffset,
    startDisk
  };

  const expectedZip64Fields: Zip64ExtraFieldDescription<keyof Zip64CentralDirectoryData>[] = [];
  if (zip64Data.uncompressedSize === ZIP64_UINT32_SENTINEL) {
    expectedZip64Fields.push({name: 'uncompressedSize', byteLength: 8});
  }
  if (zip64Data.compressedSize === ZIP64_UINT32_SENTINEL) {
    expectedZip64Fields.push({name: 'compressedSize', byteLength: 8});
  }
  if (zip64Data.localHeaderOffset === ZIP64_UINT32_SENTINEL) {
    expectedZip64Fields.push({name: 'localHeaderOffset', byteLength: 8});
  }
  if (zip64Data.startDisk === ZIP64_UINT16_SENTINEL) {
    expectedZip64Fields.push({name: 'startDisk', byteLength: 4});
  }

  const zip64Values = parseZip64ExtraField(extraField, expectedZip64Fields);

  return {
    ...zip64Data,
    ...zip64Values,
    extraFieldLength,
    fileNameLength,
    fileName,
    extraOffset
  };
};

/**
 * Create iterator over files of zip archive
 * @param fileProvider - readable file that provides random access to the file
 */
export async function* makeZipCDHeaderIterator(
  fileProvider: ReadableFile
): AsyncIterable<ZipCDFileHeader> {
  const {cdStartOffset, cdByteSize} = await parseEoCDRecord(fileProvider);
  const centralDirectory = new DataViewReadableFile(
    new DataView(await readRange(fileProvider, cdStartOffset, cdStartOffset + cdByteSize))
  );
  let cdHeader = await parseZipCDFileHeader(0n, centralDirectory);
  while (cdHeader) {
    yield cdHeader;
    cdHeader = await parseZipCDFileHeader(
      cdHeader.extraOffset + BigInt(cdHeader.extraFieldLength),
      centralDirectory
    );
  }
}

/** info that can be placed into cd header */
type GenerateCDOptions = {
  /** CRC-32 of uncompressed data */
  crc32: number;
  /** File name */
  fileName: string;
  /** File size */
  length: number;
  /** Relative offset of local file header */
  offset: bigint;
};

/**
 * generates cd header for the file
 * @param options info that can be placed into cd header
 * @returns buffer with header
 */
export function generateCDHeader(options: GenerateCDOptions): ArrayBuffer {
  const optionsToUse = {
    ...options,
    fnlength: options.fileName.length,
    extraLength: 0
  };

  let zip64header: ArrayBuffer = new ArrayBuffer(0);

  const optionsToZip64: any = {};
  if (optionsToUse.offset >= 0xffffffff) {
    optionsToZip64.offset = optionsToUse.offset;
    optionsToUse.offset = BigInt(0xffffffff);
  }
  if (optionsToUse.length >= 0xffffffff) {
    optionsToZip64.size = optionsToUse.length;
    optionsToUse.length = 0xffffffff;
  }

  if (Object.keys(optionsToZip64).length) {
    zip64header = createZip64Info(optionsToZip64);
    optionsToUse.extraLength = zip64header.byteLength;
  }
  const header = new DataView(new ArrayBuffer(Number(CD_FILE_NAME_OFFSET)));

  for (const field of ZIP_HEADER_FIELDS) {
    setFieldToNumber(
      header,
      field.size,
      field.offset,
      optionsToUse[field.name ?? ''] ?? field.default ?? 0
    );
  }

  const encodedName = new TextEncoder().encode(optionsToUse.fileName);

  const resHeader = concatenateArrayBuffers(header.buffer, encodedName, zip64header);

  return resHeader;
}

/** Fields map */
const ZIP_HEADER_FIELDS = [
  // Central directory file header signature = 0x02014b50
  {
    offset: 0,
    size: 4,
    default: new DataView(signature.buffer).getUint32(0, true)
  },

  // Version made by
  {
    offset: 4,
    size: 2,
    default: 45
  },

  // Version needed to extract (minimum)
  {
    offset: 6,
    size: 2,
    default: 45
  },

  // General purpose bit flag
  {
    offset: 8,
    size: 2,
    default: 0
  },

  // Compression method
  {
    offset: 10,
    size: 2,
    default: 0
  },

  // File last modification time
  {
    offset: 12,
    size: 2,
    default: 0
  },

  // File last modification date
  {
    offset: 14,
    size: 2,
    default: 0
  },

  // CRC-32 of uncompressed data
  {
    offset: 16,
    size: 4,
    name: 'crc32'
  },

  // Compressed size (or 0xffffffff for ZIP64)
  {
    offset: 20,
    size: 4,
    name: 'length'
  },

  // Uncompressed size (or 0xffffffff for ZIP64)
  {
    offset: 24,
    size: 4,
    name: 'length'
  },

  // File name length (n)
  {
    offset: 28,
    size: 2,
    name: 'fnlength'
  },

  // Extra field length (m)
  {
    offset: 30,
    size: 2,
    default: 0,
    name: 'extraLength'
  },

  // File comment length (k)
  {
    offset: 32,
    size: 2,
    default: 0
  },

  // Disk number where file starts (or 0xffff for ZIP64)
  {
    offset: 34,
    size: 2,
    default: 0
  },

  // Internal file attributes
  {
    offset: 36,
    size: 2,
    default: 0
  },

  // External file attributes
  {
    offset: 38,
    size: 4,
    default: 0
  },

  // Relative offset of local file header
  {
    offset: 42,
    size: 4,
    name: 'offset'
  }
];
