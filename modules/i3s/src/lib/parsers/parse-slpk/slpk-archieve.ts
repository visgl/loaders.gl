import {processOnWorker} from '@loaders.gl/worker-utils';
import md5 from 'md5';
import {CompressionWorker} from '@loaders.gl/compression';
import {parseZipLocalFileHeader} from '../parce-zip/local-file-header';

/** Element of hash array */
type HashElement = {
  hash: Buffer;
  offset: number;
};

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

  /** Reads hash file from buffer and returns it in ready-to-use form */
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

  /** returns file with the given path from slpk archive */
  async getFile(path: string, mode: 'http' | 'raw' = 'raw'): Promise<Buffer> {
    if (mode === 'http') {
      throw new Error('http mode is not supported');
    }

    const fileToDecompress = this.getFileBytes(`${path}.gz`);

    if (fileToDecompress) {
      const decompressedData = await processOnWorker(CompressionWorker, fileToDecompress, {
        compression: 'gzip',
        operation: 'decompress',
        _workerType: 'test',
        gzip: {}
      });
      return decompressedData;
    }
    const fileWithoutCompression = this.getFileBytes(path);
    if (fileWithoutCompression) {
      return Promise.resolve(Buffer.from(fileWithoutCompression));
    }
    throw new Error('No such file in the archieve');
  }

  /** Trying to get raw file data by adress */
  private getFileBytes(path: string): ArrayBuffer | undefined {
    const nameHash = Buffer.from(md5(path), 'hex');
    const fileInfo = this.hashArray.find((val) => Buffer.compare(val.hash, nameHash) === 0);
    if (!fileInfo) {
      return undefined;
    }

    const localFileHeader = parseZipLocalFileHeader(
      this.slpkArchive.byteOffset + fileInfo?.offset,
      this.slpkArchive
    );

    const compressedFile = this.slpkArchive.buffer.slice(
      localFileHeader.fileDataOffset,
      localFileHeader.fileDataOffset + localFileHeader.compressedSize
    );

    return compressedFile;
  }
}
