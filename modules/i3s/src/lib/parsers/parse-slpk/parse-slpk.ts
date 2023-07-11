import {parseZipCDFileHeader} from '../parse-zip/cd-file-header';
import {FileProvider} from '../parse-zip/file-provider';
import {parseZipLocalFileHeader} from '../parse-zip/local-file-header';
import {searchFromTheEnd} from './search-from-the-end';
import {SLPKArchive} from './slpk-archieve';

export const parseSLPK = async (fileProvider: FileProvider): Promise<SLPKArchive> => {
  const cdFileHeaderSignature = [80, 75, 1, 2];

  const hashCDOffset = await searchFromTheEnd(fileProvider, cdFileHeaderSignature);

  const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

  if (cdFileHeader.fileName !== '@specialIndexFileHASH128@') {
    throw new Error('No hash file in slpk');
  }

  const localFileHeader = await parseZipLocalFileHeader(
    cdFileHeader.localHeaderOffset,
    fileProvider
  );
  if (!localFileHeader) {
    throw new Error('No hash file in slpk');
  }

  const fileDataOffset = localFileHeader.fileDataOffset;
  const hashFile = await fileProvider.slice(
    fileDataOffset,
    fileDataOffset + localFileHeader.compressedSize
  );

  if (!hashFile) {
    throw new Error('No hash file in slpk');
  }

  return new SLPKArchive(fileProvider, hashFile);
};
