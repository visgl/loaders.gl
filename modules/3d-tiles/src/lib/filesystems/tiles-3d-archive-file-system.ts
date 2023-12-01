import {FileProvider} from '@loaders.gl/loader-utils';
import {
  ZipFileSystem,
  CD_HEADER_SIGNATURE,
  searchFromTheEnd,
  parseZipCDFileHeader,
  parseHashTable,
  parseZipLocalFileHeader
} from '@loaders.gl/zip';
import {Tiles3DArchive} from '../../3d-tiles-archive/3d-tiles-archive-archive';

/**
 * FileSystem adapter for a 3tz (3D tiles archive format) file
 * Holds FileProvider object that provides random access to archived files.
 * The difference from ZipFileSystem is usage of `@3dtilesIndex1@` index file that increases
 * access speed to archived files
 * @see https://github.com/erikdahlstrom/3tz-specification/blob/master/Specification.md
 */
export class Tiles3DArchiveFileSystem extends ZipFileSystem {
  hashTable?: Record<string, bigint> | null;

  /**
   * Constructor
   * @param file - instance of FileProvider or file path string
   */
  constructor(file: FileProvider | string) {
    super(file);
  }

  /**
   * Implementation of fetch against this file system.
   * It tries to take `@3dtilesIndex1@` file from the archive and use it
   * for faster access to archived files
   * @param filename - name of a file
   * @returns - Response with file data
   */
  async fetch(filename: string): Promise<Response> {
    const fileProvider = this.fileProvider;
    if (!fileProvider) {
      throw new Error('No data detected in the zip archive');
    }
    await this.parseHashTable();
    if (this.hashTable) {
      const archive = new Tiles3DArchive(fileProvider, this.hashTable);

      const fileData = await archive.getFile(filename);
      const response = new Response(fileData);
      Object.defineProperty(response, 'url', {value: `${this.fileName || ''}/${filename}`});
      return response;
    }
    return super.fetch(filename);
  }

  /**
   * Try to get and parse '@3dtilesIndex1@' file, that allows to get direct access
   * to files inside the archive
   * @returns void
   */
  private async parseHashTable(): Promise<void> {
    if (this.hashTable !== undefined) {
      return;
    }

    const fileProvider = this.fileProvider;
    if (!fileProvider) {
      throw new Error('No data detected in the zip archive');
    }

    const hashCDOffset = await searchFromTheEnd(fileProvider, CD_HEADER_SIGNATURE);

    const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

    // '@3dtilesIndex1@' is index file that must be the last in the archive. It allows
    // to improve load and read performance when the archive contains a very large number
    // of files.
    if (cdFileHeader?.fileName === '@3dtilesIndex1@') {
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

      this.hashTable = parseHashTable(hashFile);
    } else {
      this.hashTable = null;
    }
  }
}
