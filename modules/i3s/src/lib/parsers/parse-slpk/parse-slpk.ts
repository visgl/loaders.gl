import {
  parseZipCDFileHeader,
  cdSignature as cdHeaderSignature,
  FileProvider,
  parseZipLocalFileHeader,
  searchFromTheEnd,
  HashElement,
  parseHashFile,
  generateHashInfo
} from '@loaders.gl/zip';
import {SLPKArchive} from './slpk-archieve';

/**
 * Creates slpk file handler from raw file
 * @param fileProvider raw file data
 * @param cb is called with information message during parsing
 * @returns slpk file handler
 */
export const parseSLPK = async (
  fileProvider: FileProvider,
  cb?: (msg: string) => void
): Promise<SLPKArchive> => {
  const hashCDOffset = await searchFromTheEnd(fileProvider, cdHeaderSignature);

  const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

  let hashData: HashElement[];
  if (cdFileHeader?.fileName !== '@specialIndexFileHASH128@') {
    cb?.('SLPK doesnt contain hash file');
    hashData = await generateHashInfo(fileProvider);
    cb?.('hash info has been composed according to central directory records');
  } else {
    cb?.('SLPK contains hash file');
    const localFileHeader = await parseZipLocalFileHeader(
      cdFileHeader.localHeaderOffset,
      fileProvider
    );
    if (!localFileHeader) {
      throw new Error('corrupted SLPK');
    }

    const fileDataOffset = localFileHeader.fileDataOffset;
    const hashFile = await fileProvider.slice(
      fileDataOffset,
      fileDataOffset + localFileHeader.compressedSize
    );

    hashData = parseHashFile(hashFile);
  }

  return new SLPKArchive(fileProvider, hashData);
};
