import md5 from 'md5';
import {FileProvider, parseZipLocalFileHeader} from '@loaders.gl/zip';
import {GZipCompression} from '@loaders.gl/compression';

/** Element of hash array */
export type HashElement = {
  /** File name hash */
  hash: Buffer;
  /** File offset in the archive */
  offset: bigint;
};

/**
 * Comparing md5 hashes according to https://github.com/Esri/i3s-spec/blob/master/docs/2.0/slpk_hashtable.pcsl.md step 5
 * @param hash1 hash to compare
 * @param hash2 hash to compare
 * @returns -1 if hash1 < hash2, 0 of hash1 === hash2, 1 if hash1 > hash2
 */
export const compareHashes = (hash1: Buffer, hash2: Buffer): number => {
  const h1 = new BigUint64Array(hash1.buffer, hash1.byteOffset, 2);
  const h2 = new BigUint64Array(hash2.buffer, hash2.byteOffset, 2);

  const diff = h1[0] === h2[0] ? h1[1] - h2[1] : h1[0] - h2[0];

  if (diff < 0n) {
    return -1;
  } else if (diff === 0n) {
    return 0;
  }
  return 1;
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
    test: /^nodes\/(\d+|root)$/,
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
  private slpkArchive: FileProvider;
  private hashArray: HashElement[];
  constructor(slpkArchive: FileProvider, hashFile: HashElement[]) {
    this.slpkArchive = slpkArchive;
    this.hashArray = hashFile;
  }

  /**
   * Binary search in the hash info
   * @param hashToSearch hash that we need to find
   * @returns required hash element or undefined if not found
   */
  private findBin = (hashToSearch: Buffer): HashElement | undefined => {
    let lowerBorder = 0;
    let upperBorder = this.hashArray.length;

    while (upperBorder - lowerBorder > 1) {
      const middle = lowerBorder + Math.floor((upperBorder - lowerBorder) / 2);
      const value = compareHashes(this.hashArray[middle].hash, hashToSearch);
      if (value === 0) {
        return this.hashArray[middle];
      } else if (value < 0) {
        lowerBorder = middle;
      } else {
        upperBorder = middle;
      }
    }
    return undefined;
  };

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
    return Buffer.from(data);
  }

  /**
   * Trying to get raw file data by adress
   * @param path - path inside the archive
   * @returns buffer with the raw file data
   */
  private async getFileBytes(path: string): Promise<ArrayBuffer | undefined> {
    const nameHash = Buffer.from(md5(path), 'hex');
    const fileInfo = this.findBin(nameHash); // implement binary search
    if (!fileInfo) {
      return undefined;
    }

    const localFileHeader = await parseZipLocalFileHeader(fileInfo.offset, this.slpkArchive);
    if (!localFileHeader) {
      return undefined;
    }

    const compressedFile = this.slpkArchive.slice(
      localFileHeader.fileDataOffset,
      localFileHeader.fileDataOffset + localFileHeader.compressedSize
    );

    return compressedFile;
  }
}
