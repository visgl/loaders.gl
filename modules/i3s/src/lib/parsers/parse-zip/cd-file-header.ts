import {FileProvider} from './file-provider';

/**
 * zip central directory file header info
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipCDFileHeader = {
  /** Compressed size */
  compressedSize: bigint;
  /** Uncompressed size */
  uncompressedSize: bigint;
  /** File name length */
  fileNameLength: number;
  /** File name */
  fileName: string;
  /** Extra field offset */
  extraOffset: bigint;
  /** Relative offset of local file header */
  localHeaderOffset: bigint;
};

/**
 * Parses central directory file header of zip file
 * @param headerOffset - offset in the archive where header starts
 * @param buffer - buffer containing whole array
 * @returns Info from the header
 */
export const parseZipCDFileHeader = async (
  headerOffset: bigint,
  buffer: FileProvider
): Promise<ZipCDFileHeader> => {
  const offsets = {
    CD_COMPRESSED_SIZE_OFFSET: 20n,
    CD_UNCOMPRESSED_SIZE_OFFSET: 24n,
    CD_FILE_NAME_LENGTH_OFFSET: 28n,
    CD_EXTRA_FIELD_LENGTH_OFFSET: 30n,
    CD_LOCAL_HEADER_OFFSET_OFFSET: 42n,
    CD_FILE_NAME_OFFSET: 46n
  };

  let compressedSize = BigInt(
    await buffer.getUint32(headerOffset + offsets.CD_COMPRESSED_SIZE_OFFSET)
  );

  let uncompressedSize = BigInt(
    await buffer.getUint32(headerOffset + offsets.CD_UNCOMPRESSED_SIZE_OFFSET)
  );

  const fileNameLength = await buffer.getUint16(headerOffset + offsets.CD_FILE_NAME_LENGTH_OFFSET);

  const fileName = new TextDecoder().decode(
    await buffer.slice(
      headerOffset + offsets.CD_FILE_NAME_OFFSET,
      headerOffset + offsets.CD_FILE_NAME_OFFSET + BigInt(fileNameLength)
    )
  );

  const extraOffset = headerOffset + offsets.CD_FILE_NAME_OFFSET + BigInt(fileNameLength);

  const oldFormatOffset = await buffer.getUint32(
    headerOffset + offsets.CD_LOCAL_HEADER_OFFSET_OFFSET
  );

  let fileDataOffset = BigInt(oldFormatOffset);
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
