import {HashElement, parseHashFile} from '@loaders.gl/loader-utils';
import {
  FileProvider,
  cdSignature as cdHeaderSignature,
  generateHashInfo,
  parseZipCDFileHeader,
  parseZipLocalFileHeader,
  searchFromTheEnd
} from '@loaders.gl/zip';
import {MaxarArchive} from './maxar-archive';

/**
 * Creates 3tz file handler from raw file
 * @param fileProvider raw file data
 * @param cb is called with information message during parsing
 * @returns 3tz file handler
 */
export const parse3tz = async (
  fileProvider: FileProvider,
  cb?: (msg: string) => void
): Promise<MaxarArchive> => {
  const hashCDOffset = await searchFromTheEnd(fileProvider, cdHeaderSignature);

  const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

  let hashData: HashElement[];
  if (cdFileHeader?.fileName !== '@3dtilesIndex1@') {
    cb?.('3tz doesnt contain hash file');
    hashData = await generateHashInfo(fileProvider);
    cb?.('hash info has been composed according to central directory records');
  } else {
    cb?.('3tz contains hash file');
    const localFileHeader = await parseZipLocalFileHeader(
      cdFileHeader.localHeaderOffset,
      fileProvider
    );
    if (!localFileHeader) {
      throw new Error('corrupted 3tz');
    }

    const fileDataOffset = localFileHeader.fileDataOffset;
    const hashFile = await fileProvider.slice(
      fileDataOffset,
      fileDataOffset + localFileHeader.compressedSize
    );

    hashData = parseHashFile(hashFile);
  }

  return new MaxarArchive(fileProvider, hashData);
};
