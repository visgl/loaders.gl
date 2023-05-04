/**
 * zip local file header info
 */
export type ZipLocalFileHeader = {
  fileNameLength: number;
  extraFieldLength: number;
  fileDataOffset: number;
  compressedSize: number;
};
/**
 * Class for handling local file header of zip file
 */
export const parseZipLocalFileHeader = (
  headerOffset: number,
  buffer: DataView
): ZipLocalFileHeader => {
  const offsets = {
    COMPRESSED_SIZE_OFFSET: 18,
    FILE_NAME_LENGTH_OFFSET: 26,
    EXTRA_FIELD_LENGTH_OFFSET: 28,
    FILE_NAME_OFFSET: 30
  };

  const fileNameLength = buffer.getUint16(headerOffset + offsets.FILE_NAME_LENGTH_OFFSET, true);

  const extraFieldLength = buffer.getUint16(headerOffset + offsets.EXTRA_FIELD_LENGTH_OFFSET, true);

  const fileDataOffset =
    headerOffset + offsets.FILE_NAME_OFFSET + fileNameLength + extraFieldLength;

  const compressedSize = buffer.getUint32(headerOffset + offsets.COMPRESSED_SIZE_OFFSET, true);

  return {
    fileNameLength,
    extraFieldLength,
    fileDataOffset,
    compressedSize
  };
};
