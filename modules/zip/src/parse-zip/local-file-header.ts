// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import {FileProvider, compareArrayBuffers} from '@loaders.gl/loader-utils';
import {ZipSignature} from './search-from-the-end';

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
