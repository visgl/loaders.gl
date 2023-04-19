import {processOnWorker} from '@loaders.gl/worker-utils';
import md5 from 'md5';
import {CompressionWorker} from '@loaders.gl/compression';
import LocalFileHeader from './local-file-header';

export default class SlpkArchieve {
  slpkArchieve: DataView;
  hashArray: {hash: Buffer; offset: number}[];
  constructor(slpkArchieveBuffer: ArrayBuffer, hashFile: ArrayBuffer) {
    const hashFileBuffer = Buffer.from(hashFile);
    this.slpkArchieve = new DataView(slpkArchieveBuffer);
    this.hashArray = [];
    for (let i = 0; i < hashFileBuffer.buffer.byteLength; i = i + 24) {
      const offsetBuffer = new DataView(
        hashFileBuffer.buffer.slice(
          hashFileBuffer.byteOffset + i + 16,
          hashFileBuffer.byteOffset + i + 24
        )
      );
      const offset = offsetBuffer.getUint32(offsetBuffer.byteOffset, true);
      this.hashArray.push({
        hash: Buffer.from(
          hashFileBuffer.subarray(hashFileBuffer.byteOffset + i, hashFileBuffer.byteOffset + i + 16)
        ),
        offset
      });
    }
  }

  async getFile(path: string, mode: 'http' | 'raw' = 'raw') {
    if (mode === 'http') {
      throw new Error('http mode is not supported');
    }
    const nameHash = Buffer.from(md5(`${path}.gz`), 'hex');
    const fileInfo = this.hashArray.find((val) => Buffer.compare(val.hash, nameHash) === 0);
    if (!fileInfo) {
      throw new Error('No such file in the archieve');
    }

    const localFileHeader = new LocalFileHeader(
      this.slpkArchieve.byteOffset + fileInfo?.offset,
      this.slpkArchieve
    );
    const fileDataOffset = localFileHeader.getFileDataOffset();

    const compressedFile = this.slpkArchieve.buffer.slice(
      fileDataOffset,
      fileDataOffset + localFileHeader.getCompressedSize()
    );
    const decompressedData = await processOnWorker(CompressionWorker, compressedFile, {
      compression: 'gzip',
      operation: 'decompress',
      _workerType: 'test',
      gzip: {}
    });
    return decompressedData;
  }
}
