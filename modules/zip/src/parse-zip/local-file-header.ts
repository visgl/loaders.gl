// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  FileProviderInterface,
  compareArrayBuffers,
  concatenateArrayBuffers
} from '@loaders.gl/loader-utils';
import {ZipSignature} from './search-from-the-end';
import {createZip64Info, setFieldToNumber} from './zip64-info-generation';

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

export const signature: ZipSignature = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

/**
 * Parses local file header of zip file
 * @param headerOffset - offset in the archive where header starts
 * @param buffer - buffer containing whole array
 * @returns Info from the header
 */
export const parseZipLocalFileHeader = async (
  headerOffset: bigint,
  file: FileProviderInterface
): Promise<ZipLocalFileHeader | null> => {
  const mainHeader = new DataView(await file.slice(headerOffset, headerOffset + FILE_NAME_OFFSET));

  const magicBytes = mainHeader.buffer.slice(0, 4);
  if (!compareArrayBuffers(magicBytes, signature)) {
    return null;
  }

  const fileNameLength = mainHeader.getUint16(FILE_NAME_LENGTH_OFFSET, true);

  const extraFieldLength = mainHeader.getUint16(EXTRA_FIELD_LENGTH_OFFSET, true);

  const additionalHeader = await file.slice(
    headerOffset + FILE_NAME_OFFSET,
    headerOffset + FILE_NAME_OFFSET + BigInt(fileNameLength + extraFieldLength)
  );

  const fileNameBuffer = additionalHeader.slice(0, fileNameLength);

  const extraDataBuffer = new DataView(
    additionalHeader.slice(fileNameLength, additionalHeader.byteLength)
  );

  const fileName = new TextDecoder().decode(fileNameBuffer).split('\\').join('/');

  let fileDataOffset = headerOffset + FILE_NAME_OFFSET + BigInt(fileNameLength + extraFieldLength);

  const compressionMethod = mainHeader.getUint16(COMPRESSION_METHOD_OFFSET, true);

  let compressedSize = BigInt(mainHeader.getUint32(COMPRESSED_SIZE_OFFSET, true)); // add zip 64 logic

  let uncompressedSize = BigInt(mainHeader.getUint32(UNCOMPRESSED_SIZE_OFFSET, true)); // add zip 64 logic

  let offsetInZip64Data = 4;
  // looking for info that might be also be in zip64 extra field
  if (uncompressedSize === BigInt(0xffffffff)) {
    uncompressedSize = extraDataBuffer.getBigUint64(offsetInZip64Data, true);
    offsetInZip64Data += 8;
  }
  if (compressedSize === BigInt(0xffffffff)) {
    compressedSize = extraDataBuffer.getBigUint64(offsetInZip64Data, true);
    offsetInZip64Data += 8;
  }
  if (fileDataOffset === BigInt(0xffffffff)) {
    fileDataOffset = extraDataBuffer.getBigUint64(offsetInZip64Data, true); // setting it to the one from zip64
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
