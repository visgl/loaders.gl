// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {compareArrayBuffers, concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import {ZipSignature} from './search-from-the-end';
import {createZip64Info, setFieldToNumber} from './zip64-info-generation';
import {
  parseZip64ExtraField,
  ZIP64_UINT32_SENTINEL,
  type Zip64ExtraFieldDescription
} from './zip64-extra-field';
import {readDataView, readRange} from './readable-file-utils';

/**
 * zip local file header info
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipLocalFileHeader = {
  /** File name length */
  fileNameLength: number;
  /** File name */
  fileName: string;
  /** Extra field length */
  extraFieldLength: number;
  /** Offset of the file data */
  fileDataOffset: bigint;
  /** Compressed size */
  compressedSize: bigint;
  /** Compression method */
  compressionMethod: number;
};

// offsets accroding to https://en.wikipedia.org/wiki/ZIP_(file_format)
const COMPRESSION_METHOD_OFFSET = 8;
const COMPRESSED_SIZE_OFFSET = 18;
const UNCOMPRESSED_SIZE_OFFSET = 22;
const FILE_NAME_LENGTH_OFFSET = 26;
const EXTRA_FIELD_LENGTH_OFFSET = 28;
const FILE_NAME_OFFSET = 30n;

/** ZIP64 size values that local file headers store together. */
type Zip64LocalSizeData = {
  /** Uncompressed file size. */
  uncompressedSize: bigint;
  /** Compressed file size. */
  compressedSize: bigint;
};

export const signature: ZipSignature = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

/**
 * Parses local file header of zip file
 * @param headerOffset - offset in the archive where header starts
 * @param file - readable file containing the archive
 * @returns Info from the header
 */
export const parseZipLocalFileHeader = async (
  headerOffset: bigint,
  file: ReadableFile
): Promise<ZipLocalFileHeader | null> => {
  const mainHeader = await readDataView(file, headerOffset, headerOffset + FILE_NAME_OFFSET);

  const magicBytes = mainHeader.buffer.slice(0, 4);
  if (!compareArrayBuffers(magicBytes, signature.buffer)) {
    return null;
  }

  const fileNameLength = mainHeader.getUint16(FILE_NAME_LENGTH_OFFSET, true);

  const extraFieldLength = mainHeader.getUint16(EXTRA_FIELD_LENGTH_OFFSET, true);

  const additionalHeader = await readRange(
    file,
    headerOffset + FILE_NAME_OFFSET,
    headerOffset + FILE_NAME_OFFSET + BigInt(fileNameLength + extraFieldLength)
  );

  const fileNameBuffer = additionalHeader.slice(0, fileNameLength);

  const extraDataBuffer = new DataView(
    additionalHeader.slice(fileNameLength, additionalHeader.byteLength)
  );

  const fileName = new TextDecoder().decode(fileNameBuffer).split('\\').join('/');

  const fileDataOffset =
    headerOffset + FILE_NAME_OFFSET + BigInt(fileNameLength + extraFieldLength);

  const compressionMethod = mainHeader.getUint16(COMPRESSION_METHOD_OFFSET, true);

  let compressedSize = BigInt(mainHeader.getUint32(COMPRESSED_SIZE_OFFSET, true));

  const uncompressedSize = BigInt(mainHeader.getUint32(UNCOMPRESSED_SIZE_OFFSET, true));

  const expectedZip64Fields: Zip64ExtraFieldDescription<keyof Zip64LocalSizeData>[] = [];
  if (uncompressedSize === ZIP64_UINT32_SENTINEL || compressedSize === ZIP64_UINT32_SENTINEL) {
    // APPNOTE 4.5.3 requires both sizes in local ZIP64 extra data when either
    // 32-bit size field contains the ZIP64 sentinel.
    expectedZip64Fields.push(
      {name: 'uncompressedSize', byteLength: 8},
      {name: 'compressedSize', byteLength: 8}
    );
  }

  const zip64Sizes = parseZip64ExtraField(extraDataBuffer, expectedZip64Fields);
  if (compressedSize === ZIP64_UINT32_SENTINEL && zip64Sizes.compressedSize !== undefined) {
    compressedSize = zip64Sizes.compressedSize;
  }

  return {
    fileNameLength,
    fileName,
    extraFieldLength,
    fileDataOffset,
    compressedSize,
    compressionMethod
  };
};

/** info that can be placed into cd header */
type GenerateLocalOptions = {
  /** CRC-32 of uncompressed data */
  crc32: number;
  /** File name */
  fileName: string;
  /** File size */
  length: number;
};

/**
 * generates local header for the file
 * @param options info that can be placed into local header
 * @returns buffer with header
 */
export function generateLocalHeader(options: GenerateLocalOptions): ArrayBuffer {
  const optionsToUse = {
    ...options,
    extraLength: 0,
    fnlength: options.fileName.length
  };

  let zip64header: ArrayBuffer = new ArrayBuffer(0);

  const optionsToZip64: any = {};
  if (optionsToUse.length >= 0xffffffff) {
    optionsToZip64.size = optionsToUse.length;
    optionsToUse.length = 0xffffffff;
  }

  if (Object.keys(optionsToZip64).length) {
    zip64header = createZip64Info(optionsToZip64);
    optionsToUse.extraLength = zip64header.byteLength;
  }

  // base length without file name and extra info is static
  const header = new DataView(new ArrayBuffer(Number(FILE_NAME_OFFSET)));

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

const ZIP_HEADER_FIELDS = [
  // Local file header signature = 0x04034b50
  {
    offset: 0,
    size: 4,
    default: new DataView(signature.buffer).getUint32(0, true)
  },
  // Version needed to extract (minimum)
  {
    offset: 4,
    size: 2,
    default: 45
  },
  // General purpose bit flag
  {
    offset: 6,
    size: 2,
    default: 0
  },
  // Compression method
  {
    offset: 8,
    size: 2,
    default: 0
  },
  // File last modification time
  {
    offset: 10,
    size: 2,
    default: 0
  },
  // File last modification date
  {
    offset: 12,
    size: 2,
    default: 0
  },
  // CRC-32 of uncompressed data
  {
    offset: 14,
    size: 4,
    name: 'crc32'
  },
  // Compressed size (or 0xffffffff for ZIP64)
  {
    offset: 18,
    size: 4,
    name: 'length'
  },
  // Uncompressed size (or 0xffffffff for ZIP64)
  {
    offset: 22,
    size: 4,
    name: 'length'
  },
  // File name length (n)
  {
    offset: 26,
    size: 2,
    name: 'fnlength'
  },
  // Extra field length (m)
  {
    offset: 28,
    size: 2,
    default: 0,
    name: 'extraLength'
  }
];
