import {HashElement, compareHashes} from '@loaders.gl/loader-utils';
import {parseZipCDFileHeader} from './cd-file-header';
import {parseEoCDRecord} from './end-of-central-directory';
import {FileProvider} from './file-provider';
import md5 from 'md5';

/**
 * generates hash info from central directory
 * @param fileProvider - provider of the archive
 * @returns ready to use hash info
 */
export const generateHashInfo = async (fileProvider: FileProvider): Promise<HashElement[]> => {
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
