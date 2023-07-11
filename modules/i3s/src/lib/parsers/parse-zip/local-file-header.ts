import {FileProvider} from './file-provider';

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
};

const offsets = {
  COMPRESSED_SIZE_OFFSET: 18n,
  FILE_NAME_LENGTH_OFFSET: 26n,
  EXTRA_FIELD_LENGTH_OFFSET: 28n,
  FILE_NAME_OFFSET: 30n
};

const signature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * Parses local file header of zip file
 * @param headerOffset - offset in the archive where header starts
 * @param buffer - buffer containing whole array
 * @returns Info from the header
 */
export const parseZipLocalFileHeader = async (
  headerOffset: bigint,
  buffer: FileProvider
): Promise<ZipLocalFileHeader | undefined> => {
  if (Buffer.from(await buffer.slice(headerOffset, headerOffset + 4n)).compare(signature) !== 0) {
    return Promise.resolve(undefined);
  }

  const fileNameLength = await buffer.getUint16(headerOffset + offsets.FILE_NAME_LENGTH_OFFSET);

  const fileName = new TextDecoder().decode(
    await buffer.slice(
      headerOffset + offsets.FILE_NAME_OFFSET,
      headerOffset + offsets.FILE_NAME_OFFSET + BigInt(fileNameLength)
    )
  );
  const extraFieldLength = await buffer.getUint16(headerOffset + offsets.EXTRA_FIELD_LENGTH_OFFSET);

  const fileDataOffset =
    headerOffset + offsets.FILE_NAME_OFFSET + BigInt(fileNameLength + extraFieldLength);

  const compressedSize = BigInt(
    await buffer.getUint32(headerOffset + offsets.COMPRESSED_SIZE_OFFSET)
  ); // add zip 64 logic

  return {
    fileNameLength,
    fileName,
    extraFieldLength,
    fileDataOffset,
    compressedSize
  };
};
