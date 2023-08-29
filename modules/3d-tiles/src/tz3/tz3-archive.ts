import md5 from 'md5';
import {FileProvider, parseZipLocalFileHeader, HashElement, findBin} from '@loaders.gl/zip';
import {DeflateCompression, NoCompression} from '@loaders.gl/compression';

type CompressionHandler = (compressedFile: ArrayBuffer) => Promise<ArrayBuffer>;

/**
 * Handling different compression types in zip
 */
const COMPRESSION_METHODS: {[key: number]: CompressionHandler} = {
  /** No compression */
  0: (data) => new NoCompression().decompress(data),
  /** Deflation */
  8: (data) => new DeflateCompression({raw: true}).decompress(data)
};

/**
 * Class for handling information about 3tz file
 */
export class Tiles3DArchive {
  /** FileProvider with whe whole file */
  private zipArchiveFile: FileProvider;
  /** hash info */
  private hashArray: HashElement[];

  /**
   * creates Tiles3DArchive handler
   * @param zipArchiveFile - FileProvider with whe whole file
   * @param hashFile - hash info
   */
  constructor(zipArchiveFile: FileProvider, hashFile: HashElement[]) {
    this.zipArchiveFile = zipArchiveFile;
    this.hashArray = hashFile;
  }

  /**
   * Returns file with the given path from 3tz archive
   * @param path - path inside the 3tz
   * @returns buffer with ready to use file
   */
  async getFile(path: string): Promise<ArrayBuffer> {
    // sometimes paths are not in lower case when hash file is created,
    // so first we're looking for lower case file name and then for original one
    let data = await this.getFileBytes(path.toLocaleLowerCase());
    if (!data) {
      data = await this.getFileBytes(path);
    }
    if (!data) {
      throw new Error('No such file in the archieve');
    }
    const decompressedFile = Buffer.from(data);

    return decompressedFile.buffer;
  }

  /**
   * Trying to get raw file data by adress
   * @param path - path inside the archive
   * @returns buffer with the raw file data
   */
  private async getFileBytes(path: string): Promise<ArrayBuffer | null> {
    const nameHash = Buffer.from(md5(path), 'hex');
    const fileInfo = findBin(nameHash, this.hashArray); // implement binary search
    if (!fileInfo) {
      return null;
    }

    const localFileHeader = await parseZipLocalFileHeader(fileInfo.offset, this.zipArchiveFile);
    if (!localFileHeader) {
      return null;
    }

    const compressedFile = await this.zipArchiveFile.slice(
      localFileHeader.fileDataOffset,
      localFileHeader.fileDataOffset + localFileHeader.compressedSize
    );

    const compressionMethod = COMPRESSION_METHODS[localFileHeader.compressionMethod];
    if (!compressionMethod) {
      throw Error('Only Deflation compression is supported');
    }

    return compressionMethod(compressedFile);
  }
}
