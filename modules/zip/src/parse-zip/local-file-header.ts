// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FileProvider, compareArrayBuffers, concatenateArrayBuffers} from '@loaders.gl/loader-utils';
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
const COMPRESSION_METHOD_OFFSET = 8n;
const COMPRESSED_SIZE_OFFSET = 18n;
const UNCOMPRESSED_SIZE_OFFSET = 22n;
const FILE_NAME_LENGTH_OFFSET = 26n;
const EXTRA_FIELD_LENGTH_OFFSET = 28n;
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
  buffer: FileProvider
): Promise<ZipLocalFileHeader | null> => {
  const magicBytes = await buffer.slice(headerOffset, headerOffset + 4n);
  if (!compareArrayBuffers(magicBytes, signature)) {
    return null;
  }

  const fileNameLength = await buffer.getUint16(headerOffset + FILE_NAME_LENGTH_OFFSET);

  const fileName = new TextDecoder()
    .decode(
      await buffer.slice(
        headerOffset + FILE_NAME_OFFSET,
        headerOffset + FILE_NAME_OFFSET + BigInt(fileNameLength)
      )
    )
    .split('\\')
    .join('/');
  const extraFieldLength = await buffer.getUint16(headerOffset + EXTRA_FIELD_LENGTH_OFFSET);

  let fileDataOffset = headerOffset + FILE_NAME_OFFSET + BigInt(fileNameLength + extraFieldLength);

  const compressionMethod = await buffer.getUint16(headerOffset + COMPRESSION_METHOD_OFFSET);

  let compressedSize = BigInt(await buffer.getUint32(headerOffset + COMPRESSED_SIZE_OFFSET)); // add zip 64 logic

  let uncompressedSize = BigInt(await buffer.getUint32(headerOffset + UNCOMPRESSED_SIZE_OFFSET)); // add zip 64 logic

  const extraOffset = headerOffset + FILE_NAME_OFFSET + BigInt(fileNameLength);

  let offsetInZip64Data = 4n;
  // looking for info that might be also be in zip64 extra field
  if (uncompressedSize === BigInt(0xffffffff)) {
    uncompressedSize = await buffer.getBigUint64(extraOffset + offsetInZip64Data);
    offsetInZip64Data += 8n;
  }
  if (compressedSize === BigInt(0xffffffff)) {
    compressedSize = await buffer.getBigUint64(extraOffset + offsetInZip64Data);
    offsetInZip64Data += 8n;
  }
  if (fileDataOffset === BigInt(0xffffffff)) {
    fileDataOffset = await buffer.getBigUint64(extraOffset + offsetInZip64Data); // setting it to the one from zip64
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
