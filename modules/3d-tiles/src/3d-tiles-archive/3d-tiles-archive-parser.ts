// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {FileProviderInterface} from '@loaders.gl/loader-utils';
import {
  CD_HEADER_SIGNATURE,
  makeHashTableFromZipHeaders,
  parseHashTable,
  parseZipCDFileHeader,
  parseZipLocalFileHeader,
  searchFromTheEnd
} from '@loaders.gl/zip';
import {Tiles3DArchive} from './3d-tiles-archive-archive';

/**
 * Creates 3tz file handler from raw file
 * @param fileProvider raw file data
 * @param cb is called with information message during parsing
 * @returns 3tz file handler
 */
export const parse3DTilesArchive = async (
  fileProvider: FileProviderInterface,
  cb?: (msg: string) => void
): Promise<Tiles3DArchive> => {
  const hashCDOffset = await searchFromTheEnd(fileProvider, CD_HEADER_SIGNATURE);

  const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

  let hashTable: Record<string, bigint>;
  if (cdFileHeader?.fileName !== '@3dtilesIndex1@') {
    hashTable = await makeHashTableFromZipHeaders(fileProvider);
    cb?.(
      '3tz doesnt contain hash file, hash info has been composed according to zip archive headers'
    );
  } else {
    // cb?.('3tz contains hash file');
    const localFileHeader = await parseZipLocalFileHeader(
      cdFileHeader.localHeaderOffset,
      fileProvider
    );
    if (!localFileHeader) {
      throw new Error('corrupted 3tz zip archive');
    }

    const fileDataOffset = localFileHeader.fileDataOffset;
    const hashFile = await fileProvider.slice(
      fileDataOffset,
      fileDataOffset + localFileHeader.compressedSize
    );

    hashTable = parseHashTable(hashFile);
  }

  return new Tiles3DArchive(fileProvider, hashTable);
};
