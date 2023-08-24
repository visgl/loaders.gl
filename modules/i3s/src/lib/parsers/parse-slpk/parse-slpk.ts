import md5 from 'md5';
import {
  parseZipCDFileHeader,
  cdSignature as cdHeaderSignature,
  parseEoCDRecord,
  FileProvider,
  parseZipLocalFileHeader,
  searchFromTheEnd,
  HashElement,
  compareHashes,
  parseHashFile
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

/**
 * generates hash info from central directory
 * @param fileProvider - provider of the archive
 * @returns ready to use hash info
 */
const generateHashInfo = async (fileProvider: FileProvider): Promise<HashElement[]> => {
  const {cdStartOffset} = await parseEoCDRecord(fileProvider);
  let cdHeader = await parseZipCDFileHeader(cdStartOffset, fileProvider);
  const hashInfo: HashElement[] = [];
  while (cdHeader) {
    hashInfo.push({
      hash: Buffer.from(md5(cdHeader.fileName.split('\\').join('/').toLocaleLowerCase()), 'hex'),
      offset: cdHeader.localHeaderOffset
    });
    cdHeader = await parseZipCDFileHeader(
      cdHeader.extraOffset + BigInt(cdHeader.extraFieldLength),
      fileProvider
    );
  }
  hashInfo.sort((a, b) => compareHashes(a.hash, b.hash));
  return hashInfo;
};
