import { FileProvider } from "./file-provider";

/**
 * zip local file header info
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipLocalFileHeader = {
  /**
   * File name length
   */
  fileNameLength: number;
  /**
   * Extra field length
   */
  extraFieldLength: number;
  /**
   * Offset of the file data
   */
  fileDataOffset: number;
  /**
   * Compressed size
   */
  compressedSize: number;
};

/**
 * Parses local file header of zip file
 * @param headerOffset - offset in the archive where header starts
 * @param buffer - buffer containing whole array
 * @returns Info from the header
 */
export const parseZipLocalFileHeader = (
  headerOffset: number,
  buffer: FileProvider
): ZipLocalFileHeader => {
  const offsets = {
    COMPRESSED_SIZE_OFFSET: 18,
    FILE_NAME_LENGTH_OFFSET: 26,
    EXTRA_FIELD_LENGTH_OFFSET: 28,
    FILE_NAME_OFFSET: 30
  };

  const fileNameLength = buffer.getUint16(headerOffset + offsets.FILE_NAME_LENGTH_OFFSET);

  const extraFieldLength = buffer.getUint16(headerOffset + offsets.EXTRA_FIELD_LENGTH_OFFSET);

  const fileDataOffset =
    headerOffset + offsets.FILE_NAME_OFFSET + fileNameLength + extraFieldLength;

  const compressedSize = buffer.getUint32(headerOffset + offsets.COMPRESSED_SIZE_OFFSET);

  return {
    fileNameLength,
    extraFieldLength,
    fileDataOffset,
    compressedSize
  };
};
