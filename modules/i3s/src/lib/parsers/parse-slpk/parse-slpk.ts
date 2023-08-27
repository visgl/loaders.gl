import md5 from 'md5';
import {parseZipCDFileHeader, signature as cdHeaderSignature} from '../parse-zip/cd-file-header';
import {parseEoCDRecord} from '../parse-zip/end-of-central-directory';
import {FileProvider} from '../parse-zip/file-provider';
import {parseZipLocalFileHeader} from '../parse-zip/local-file-header';
import {searchFromTheEnd} from '../parse-zip/search-from-the-end';
import {HashElement, SLPKArchive, compareHashes} from './slpk-archieve';

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

/**
 * Reads hash file from buffer and returns it in ready-to-use form
 * @param hashFile - bufer containing hash file
 * @returns Array containing file info
 */
const parseHashFile = (hashFile: ArrayBuffer): HashElement[] => {
  const hashFileBuffer = Buffer.from(hashFile);
  const hashArray: HashElement[] = [];
  for (let i = 0; i < hashFileBuffer.buffer.byteLength; i = i + 24) {
    const offsetBuffer = new DataView(
      hashFileBuffer.buffer.slice(
        hashFileBuffer.byteOffset + i + 16,
        hashFileBuffer.byteOffset + i + 24
      )
    );
    const offset = offsetBuffer.getBigUint64(offsetBuffer.byteOffset, true);
    hashArray.push({
      hash: Buffer.from(
        hashFileBuffer.subarray(hashFileBuffer.byteOffset + i, hashFileBuffer.byteOffset + i + 16)
      ),
      offset
    });
  }
  return hashArray;
};
