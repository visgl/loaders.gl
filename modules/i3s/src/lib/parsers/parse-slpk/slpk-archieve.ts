import md5 from 'md5';
import {parseZipLocalFileHeader} from '../parse-zip/local-file-header';
import {BufferFileProvider} from '../parse-zip/buffer-file-provider';
import {GZipCompression} from '@loaders.gl/compression';

/** Element of hash array */
type HashElement = {
  /**
   * File name hash
   */
  hash: Buffer;
  /**
   * File offset in the archive
   */
  offset: number;
};

/** Description of real paths for different file types */
const PATH_DESCRIPTIONS: {test: RegExp; extensions: string[]}[] = [
  {
    test: /^$/,
    extensions: ['3dSceneLayer.json.gz']
  },
  {
    test: /^nodepages\/\d+$/,
    extensions: ['.json.gz']
  },
  {
    test: /^nodes\/\d+$/,
    extensions: ['/3dNodeIndexDocument.json.gz']
  },
  {
    test: /^nodes\/\d+\/textures\/.+$/,
    extensions: ['.jpg', '.png', '.bin.dds.gz', '.ktx']
  },
  {
    test: /^nodes\/\d+\/geometries\/\d+$/,
    extensions: ['.bin.gz', '.draco.gz']
  },
  {
    test: /^nodes\/\d+\/attributes\/f_\d+\/\d+$/,
    extensions: ['.bin.gz']
  },
  {
    test: /^statistics\/f_\d+\/\d+$/,
    extensions: ['.json.gz']
  },
  {
    test: /^nodes\/\d+\/shared$/,
    extensions: ['/sharedResource.json.gz']
  }
];

/**
 * Class for handling information about slpk file
 */
export class SLPKArchive {
  slpkArchive: DataView;
  hashArray: {hash: Buffer; offset: number}[];
  constructor(slpkArchiveBuffer: ArrayBuffer, hashFile: ArrayBuffer) {
    this.slpkArchive = new DataView(slpkArchiveBuffer);
    this.hashArray = this.parseHashFile(hashFile);
  }

  /**
   * Reads hash file from buffer and returns it in ready-to-use form
   * @param hashFile - bufer containing hash file
   * @returns Array containing file info
   */
  private parseHashFile(hashFile: ArrayBuffer): HashElement[] {
    const hashFileBuffer = Buffer.from(hashFile);
    const hashArray: HashElement[] = [];
    for (let i = 0; i < hashFileBuffer.buffer.byteLength; i = i + 24) {
      const offsetBuffer = new DataView(
        hashFileBuffer.buffer.slice(
          hashFileBuffer.byteOffset + i + 16,
          hashFileBuffer.byteOffset + i + 24
        )
      );
      const offset = offsetBuffer.getUint32(offsetBuffer.byteOffset, true);
      hashArray.push({
        hash: Buffer.from(
          hashFileBuffer.subarray(hashFileBuffer.byteOffset + i, hashFileBuffer.byteOffset + i + 16)
        ),
        offset
      });
    }
    return hashArray;
  }

  /**
   * Returns file with the given path from slpk archive
   * @param path - path inside the slpk
   * @param mode - currently only raw mode supported
   * @returns buffer with ready to use file
   */
  async getFile(path: string, mode: 'http' | 'raw' = 'raw'): Promise<Buffer> {
    if (mode === 'http') {
      const extensions = PATH_DESCRIPTIONS.find((val) => val.test.test(path))?.extensions;
      if (extensions) {
        let data: ArrayBuffer | undefined;
        for (const ext of extensions) {
          data = await this.getDataByPath(`${path}${ext}`);
          if (data) {
            break;
          }
        }
        if (data) {
          return Buffer.from(data);
        }
      }
    }
    if (mode === 'raw') {
      const decompressedFile = await this.getDataByPath(`${path}.gz`);
      if (decompressedFile) {
        return Buffer.from(decompressedFile);
      }
      const fileWithoutCompression = await this.getFileBytes(path);
      if (fileWithoutCompression) {
        return Buffer.from(fileWithoutCompression);
      }
    }

    throw new Error('No such file in the archieve');
  }

  /**
   * returning uncompressed data for paths that ends with .gz and raw data for all other paths
   * @param path - path inside the archive
   * @returns buffer with the file data
   */
  private async getDataByPath(path: string): Promise<ArrayBuffer | undefined> {
    const data = await this.getFileBytes(path);
    if (!data) {
      return undefined;
    }
    if (/\.gz$/.test(path)) {
      const compression = new GZipCompression();

      const decompressedData = await compression.decompress(data);
      return decompressedData;
    }
    return Buffer.from(data);
  }

  /**
   * Trying to get raw file data by adress
   * @param path - path inside the archive
   * @returns buffer with the raw file data
   */
  private async getFileBytes(path: string): Promise<ArrayBuffer | undefined> {
    const nameHash = Buffer.from(md5(path), 'hex');
    const fileInfo = this.hashArray.find((val) => Buffer.compare(val.hash, nameHash) === 0);
    if (!fileInfo) {
      return undefined;
    }

    const localFileHeader = await parseZipLocalFileHeader(
      this.slpkArchive.byteOffset + fileInfo?.offset,
      new BufferFileProvider(this.slpkArchive)
    );
    if (!localFileHeader) {
      return undefined;
    }

    const compressedFile = this.slpkArchive.buffer.slice(
      localFileHeader.fileDataOffset,
      localFileHeader.fileDataOffset + localFileHeader.compressedSize
    );

    return compressedFile;
  }
}
