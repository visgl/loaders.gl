import { FileProvider } from "./file-provider";

/**
 * zip central directory file header info
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipCDFileHeader = {
  /**
   * Compressed size
   */
  compressedSize: number;
  /**
   * Uncompressed size
   */
  uncompressedSize: number;
  /**
   * File name length
   */
  fileNameLength: number;
  /**
   * File name
   */
  fileName: ArrayBuffer;
  /**
   * Extra field offset
   */
  extraOffset: number;
  /**
   * Relative offset of local file header
   */
  localHeaderOffset: number;
};

/**
 * Parses central directory file header of zip file
 * @param headerOffset - offset in the archive where header starts
 * @param buffer - buffer containing whole array
 * @returns Info from the header
 */
export const parseZipCDFileHeader = (headerOffset: number, buffer: FileProvider): ZipCDFileHeader => {
  const offsets = {
    CD_COMPRESSED_SIZE_OFFSET: 20,
    CD_UNCOMPRESSED_SIZE_OFFSET: 24,
    CD_FILE_NAME_LENGTH_OFFSET: 28,
    CD_EXTRA_FIELD_LENGTH_OFFSET: 30,
    CD_LOCAL_HEADER_OFFSET_OFFSET: 42,
    CD_FILE_NAME_OFFSET: 46
  };

  const compressedSize = buffer.getUint32(headerOffset + offsets.CD_COMPRESSED_SIZE_OFFSET);

  const uncompressedSize = buffer.getUint32(
    headerOffset + offsets.CD_UNCOMPRESSED_SIZE_OFFSET
  );

  const fileNameLength = buffer.getUint16(headerOffset + offsets.CD_FILE_NAME_LENGTH_OFFSET);

  const fileName = buffer.slice(
    headerOffset + offsets.CD_FILE_NAME_OFFSET,
    headerOffset + offsets.CD_FILE_NAME_OFFSET + fileNameLength
  );

  const extraOffset = headerOffset + offsets.CD_FILE_NAME_OFFSET + fileNameLength;

  const oldFormatOffset = buffer.getUint32(
    headerOffset + offsets.CD_LOCAL_HEADER_OFFSET_OFFSET
  );

  let fileDataOffset = oldFormatOffset;
  if (fileDataOffset === 0xffffffff) {
    let offsetInZip64Data = 4;
    // looking for info that might be also be in zip64 extra field
    if (compressedSize === 0xffffffff) {
      offsetInZip64Data += 8;
    }
    if (uncompressedSize === 0xffffffff) {
      offsetInZip64Data += 8;
    }

    // getUint32 needs to be replaced with getBigUint64 for archieves bigger than 2gb
    fileDataOffset = buffer.getUint32(extraOffset + offsetInZip64Data); // setting it to the one from zip64
  }
  const localHeaderOffset = fileDataOffset;

  return {
    compressedSize,
    uncompressedSize,
    fileNameLength,
    fileName,
    extraOffset,
    localHeaderOffset
  };
};
