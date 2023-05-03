import {processOnWorker} from '@loaders.gl/worker-utils';
import md5 from 'md5';
import {CompressionWorker} from '@loaders.gl/compression';
import LocalFileHeader from './local-file-header';

interface HashElement {
  hash: Buffer;
  offset: number;
}

/**
 * Class for handling information about slpk file
 */
export default class SlpkArchive {
  slpkArchive: DataView;
  hashArray: {hash: Buffer; offset: number}[];
  constructor(slpkArchiveBuffer: ArrayBuffer, hashFile: ArrayBuffer) {
    this.slpkArchive = new DataView(slpkArchiveBuffer);
    this.hashArray = this.parseHashFile(hashFile);
  }

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

  private getFileBytes(path: string): ArrayBuffer | undefined {
    const nameHash = Buffer.from(md5(path), 'hex');
    const fileInfo = this.hashArray.find((val) => Buffer.compare(val.hash, nameHash) === 0);
    if (!fileInfo) {
      return undefined;
    }

    const localFileHeader = new LocalFileHeader(
      this.slpkArchive.byteOffset + fileInfo?.offset,
      this.slpkArchive
    );
    const fileDataOffset = localFileHeader.fileDataOffset;

    const compressedFile = this.slpkArchive.buffer.slice(
      fileDataOffset,
      fileDataOffset + localFileHeader.compressedSize
    );

    return compressedFile;
  }
}
