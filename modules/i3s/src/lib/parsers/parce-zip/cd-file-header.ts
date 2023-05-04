/**
 * zip central directory file header info
 */
export type ZipCDFileHeader = {
  compressedSize: number;
  uncompressedSize: number;
  fileNameLength: number;
  fileName: ArrayBuffer;
  extraOffset: number;
  oldFormatOffset: number;
  localHeaderOffset: number;
};

/**
 * parses central directory file header of zip file
 */
export const parseZipCDFileHeader = (headerOffset: number, buffer: DataView): ZipCDFileHeader => {
  const offsets = {
    CD_COMPRESSED_SIZE_OFFSET: 20,
    CD_UNCOMPRESSED_SIZE_OFFSET: 24,
    CD_FILE_NAME_LENGTH_OFFSET: 28,
    CD_EXTRA_FIELD_LENGTH_OFFSET: 30,
    CD_LOCAL_HEADER_OFFSET_OFFSET: 42,
    CD_FILE_NAME_OFFSET: 46
  };

  const compressedSize = buffer.getUint32(headerOffset + offsets.CD_COMPRESSED_SIZE_OFFSET, true);

  const uncompressedSize = buffer.getUint32(
    headerOffset + offsets.CD_UNCOMPRESSED_SIZE_OFFSET,
    true
  );

  const fileNameLength = buffer.getUint16(headerOffset + offsets.CD_FILE_NAME_LENGTH_OFFSET, true);

  const fileName = buffer.buffer.slice(
    headerOffset + offsets.CD_FILE_NAME_OFFSET,
    headerOffset + offsets.CD_FILE_NAME_OFFSET + fileNameLength
  );

  const extraOffset = headerOffset + offsets.CD_FILE_NAME_OFFSET + fileNameLength;

  const oldFormatOffset = buffer.getUint32(
    headerOffset + offsets.CD_LOCAL_HEADER_OFFSET_OFFSET,
    true
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
    fileDataOffset = buffer.getUint32(extraOffset + offsetInZip64Data, true); // setting it to the one from zip64
  }
  const localHeaderOffset = fileDataOffset;

  return {
    compressedSize,
    uncompressedSize,
    fileNameLength,
    fileName,
    extraOffset,
    oldFormatOffset,
    localHeaderOffset
  };
};
