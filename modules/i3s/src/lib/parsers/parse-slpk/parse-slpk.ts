import {FileProviderInterface} from '@loaders.gl/loader-utils';
import {
  parseZipCDFileHeader,
  CD_HEADER_SIGNATURE,
  parseZipLocalFileHeader,
  searchFromTheEnd,
  parseHashTable,
  makeHashTableFromZipHeaders
} from '@loaders.gl/zip';
import {SLPKArchive} from './slpk-archieve';

/**
 * Creates slpk file handler from raw file
 * @param fileProvider raw file data
 * @param cb is called with information message during parsing
 * @returns slpk file handler
 */
export async function parseSLPKArchive(
  fileProvider: FileProviderInterface,
  cb?: (msg: string) => void,
  fileName?: string
): Promise<SLPKArchive> {
  const hashCDOffset = await searchFromTheEnd(fileProvider, CD_HEADER_SIGNATURE);

  const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

  let hashTable: Record<string, bigint>;
  if (cdFileHeader?.fileName !== '@specialIndexFileHASH128@') {
    hashTable = await makeHashTableFromZipHeaders(fileProvider);
    cb?.(
      'SLPK doesnt contain hash file, hash info has been composed according to zip archive headers'
    );
  } else {
    // cb?.('SLPK contains hash file');
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

    hashTable = parseHashTable(hashFile);
  }

  return new SLPKArchive(fileProvider, hashTable, fileName);
}
