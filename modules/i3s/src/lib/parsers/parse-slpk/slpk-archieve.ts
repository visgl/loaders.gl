import {MD5Hash} from '@loaders.gl/crypto';
import {FileProviderInterface} from '@loaders.gl/loader-utils';
import {IndexedArchive, parseZipLocalFileHeader} from '@loaders.gl/zip';
import {GZipCompression} from '@loaders.gl/compression';

/** Description of real paths for different file types */
const PATH_DESCRIPTIONS: {test: RegExp; extensions: string[]}[] = [
  {
    test: /^$/,
    extensions: ['3dSceneLayer.json.gz']
  },
  {
    test: /nodepages\/\d+$/,
    extensions: ['.json.gz']
  },
  {
    test: /sublayers\/\d+$/,
    extensions: ['/3dSceneLayer.json.gz']
  },
  {
    test: /nodes\/(\d+|root)$/,
    extensions: ['/3dNodeIndexDocument.json.gz']
  },
  {
    test: /nodes\/\d+\/textures\/.+$/,
    extensions: ['.jpg', '.png', '.bin.dds.gz', '.ktx', '.ktx2']
  },
  {
    test: /nodes\/\d+\/geometries\/\d+$/,
    extensions: ['.bin.gz', '.draco.gz']
  },
  {
    test: /nodes\/\d+\/attributes\/f_\d+\/\d+$/,
    extensions: ['.bin.gz']
  },
  {
    test: /statistics\/(f_\d+\/\d+|summary)$/,
    extensions: ['.json.gz']
  },
  {
    test: /statistics\/summary$/,
    extensions: ['.json.gz']
  },
  {
    test: /nodes\/\d+\/shared$/,
    extensions: ['/sharedResource.json.gz']
  }
];

/**
 * Class for handling information about slpk file
 */
export class SLPKArchive extends IndexedArchive {
  // Maps hex-encoded md5 filename hashes to bigint offsets into the archive
  private hashTable?: Record<string, bigint>;

  protected _textEncoder = new TextEncoder();
  protected _textDecoder = new TextDecoder();
  protected _md5Hash = new MD5Hash();

  /**
   * Constructor
   * @param fileProvider - instance of a binary data reader
   * @param hashTable - pre-loaded hashTable. If presented, getFile will skip reading the hash file
   * @param fileName - name of the archive. It is used to add to an URL of a loader context
   */
  constructor(
    fileProvider: FileProviderInterface,
    hashTable?: Record<string, bigint>,
    fileName?: string
  ) {
    super(fileProvider, hashTable, fileName);
    this.hashTable = hashTable;
  }

  /**
   * Returns file with the given path from slpk archive
   * @param path - path inside the slpk
   * @param mode - currently only raw mode supported
   * @returns buffer with ready to use file
   */
  async getFile(path: string, mode: 'http' | 'raw' = 'raw'): Promise<ArrayBuffer> {
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
          return data;
        }
      }
    }
    if (mode === 'raw') {
      const decompressedFile = await this.getDataByPath(`${path}.gz`);
      if (decompressedFile) {
        return decompressedFile;
      }
      const fileWithoutCompression = await this.getFileBytes(path);
      if (fileWithoutCompression) {
        return fileWithoutCompression;
      }
    }

    throw new Error(`No such file in the archive: ${path}`);
  }

  /**
   * returning uncompressed data for paths that ends with .gz and raw data for all other paths
   * @param path - path inside the archive
   * @returns buffer with the file data
   */
  private async getDataByPath(path: string): Promise<ArrayBuffer | undefined> {
    // sometimes paths are not in lower case when hash file is created,
    // so first we're looking for lower case file name and then for original one
    let data = await this.getFileBytes(path.toLocaleLowerCase());
    if (!data) {
      data = await this.getFileBytes(path);
    }
    if (!data) {
      return undefined;
    }
    if (/\.gz$/.test(path)) {
      const compression = new GZipCompression();

      const decompressedData = await compression.decompress(data);
      return decompressedData;
    }
    return data;
  }

  /**
   * Trying to get raw file data by address
   * @param path - path inside the archive
   * @returns buffer with the raw file data
   */
  private async getFileBytes(path: string): Promise<ArrayBuffer | undefined> {
    let compressedFile: ArrayBuffer | undefined;
    if (this.hashTable) {
      const binaryPath = this._textEncoder.encode(path);
      const nameHash = await this._md5Hash.hash(binaryPath.buffer, 'hex');

      const offset = this.hashTable[nameHash];
      if (offset === undefined) {
        return undefined;
      }

      const localFileHeader = await parseZipLocalFileHeader(offset, this.fileProvider);
      if (!localFileHeader) {
        return undefined;
      }

      compressedFile = await this.fileProvider.slice(
        localFileHeader.fileDataOffset,
        localFileHeader.fileDataOffset + localFileHeader.compressedSize
      );
    } else {
      try {
        compressedFile = await this.getFileWithoutHash(path);
      } catch {
        compressedFile = undefined;
      }
    }

    return compressedFile;
  }
}
