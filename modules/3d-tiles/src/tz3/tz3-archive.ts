import md5 from 'md5';
import {FileProvider, parseZipLocalFileHeader, HashElement, findBin} from '@loaders.gl/zip';
import {DeflateCompression} from '@loaders.gl/compression';

type CompressionHandler = (compressedFile: ArrayBuffer) => Promise<ArrayBuffer>;

/**
 * Handling different compression types in zip
 */
const COMPRESSION_METHODS: {[key: number]: CompressionHandler} = {
  /** No compression */
  0: async (compressedFile) => compressedFile,

  /** Deflation */
  8: async (compressedFile) => {
    const compression = new DeflateCompression({raw: true});
    const decompressedData = await compression.decompress(compressedFile);
    return decompressedData;
  }
};

/**
 * Class for handling information about 3tz file
 */
export class TZ3Archive {
  private tz3Archive: FileProvider;
  private hashArray: HashElement[];
  constructor(tz3Archive: FileProvider, hashFile: HashElement[]) {
    this.tz3Archive = tz3Archive;
    this.hashArray = hashFile;
  }

  /**
   * Returns file with the given path from 3tz archive
   * @param path - path inside the 3tz
   * @returns buffer with ready to use file
   */
  async getFile(path: string): Promise<Buffer> {
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

    return decompressedFile;
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

    const localFileHeader = await parseZipLocalFileHeader(fileInfo.offset, this.tz3Archive);
    if (!localFileHeader) {
      return null;
    }

    const compressedFile = await this.tz3Archive.slice(
      localFileHeader.fileDataOffset,
      localFileHeader.fileDataOffset + localFileHeader.compressedSize
    );

    if (
      Object.keys(COMPRESSION_METHODS).indexOf(localFileHeader.compressionMethod.toString()) === -1
    ) {
      throw Error('Only Deflation compression is supported');
    }

    return COMPRESSION_METHODS[localFileHeader.compressionMethod](compressedFile);
  }
}
