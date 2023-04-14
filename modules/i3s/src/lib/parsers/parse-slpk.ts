import {processOnWorker} from '@loaders.gl/worker-utils';
import md5 from 'md5';
import {CompressionWorker} from '@loaders.gl/compression';
import {I3SLoaderOptions} from '../../i3s-loader';

class CDFileHeader {
  cdCompressedSize = 20;
  cdUncompressedSize = 24;
  cdFileNameLength = 28;
  cdExtraFieldLength = 30;
  cdLocalHeaderOffset = 42;
  cdFileName = 46;

  headerOffset: number;
  buffer: DataView;
  constructor(headerOffset: number, buffer: DataView) {
    this.headerOffset = headerOffset;
    this.buffer = buffer;
  }

  getCompressedSize() {
    return this.buffer.getUint32(this.headerOffset + this.cdCompressedSize, true);
  }

  getUncompressedSize() {
    return this.buffer.getUint32(this.headerOffset + this.cdUncompressedSize, true);
  }

  getFileNameLength() {
    return this.buffer.getUint16(this.headerOffset + this.cdFileNameLength, true);
  }

  getFileName() {
    return this.buffer.buffer.slice(
      this.headerOffset + this.cdFileName,
      this.headerOffset + this.cdFileName + this.getFileNameLength()
    );
  }

  getExtraOffset() {
    return this.headerOffset + this.cdFileName + this.getFileNameLength();
  }

  getOldFormatOffset() {
    return this.buffer.getUint32(this.headerOffset + this.cdLocalHeaderOffset, true);
  }

  getLocalHeaderOffset() {
    let fileDataOffset = this.getOldFormatOffset();
    if (fileDataOffset === 0xffffffff) {
      let offsetInZip64Data = 4;
      if (this.getCompressedSize() === 0xffffffff) {
        // looking for info that might be also be in zip64 extra field
        offsetInZip64Data += 8;
      }
      if (this.getUncompressedSize() === 0xffffffff) {
        offsetInZip64Data += 8;
      }

      fileDataOffset = this.buffer.getUint32(this.getExtraOffset() + offsetInZip64Data, true); // setting it to the one from zip64
      // getUint32 needs to be replaced with getBigUint64 for archieves bigger than 2gb
    }
    return fileDataOffset;
  }
}

class LocalFileHeader {
  compressedSize = 18;
  fileNameLength = 26;
  extraFieldLength = 28;
  fileName = 30;

  headerOffset: number;
  buffer: DataView;
  constructor(headerOffset: number, buffer: DataView) {
    this.headerOffset = headerOffset;
    this.buffer = buffer;
  }

  getFileNameLength() {
    return this.buffer.getUint16(this.headerOffset + this.fileNameLength, true);
  }

  getExtraFieldLength() {
    return this.buffer.getUint16(this.headerOffset + this.extraFieldLength, true);
  }

  getFileDataOffset() {
    return (
      this.headerOffset + this.fileName + this.getFileNameLength() + this.getExtraFieldLength()
    );
  }

  getCompressedSize() {
    return this.buffer.getUint32(this.headerOffset + this.compressedSize, true);
  }
}

class SlpkArchieve {
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

  /* eslint-disable consistent-return */
  async getFile(path: string, mode: 'http' | 'raw' = 'raw') {
    if (mode === 'http') {
      throw new Error('http mode is not supported');
    }
    const nameHash = Buffer.from(md5(`${path}.gz`), 'hex');
    const fileInfo = this.hashArray.find((val) => Buffer.compare(val.hash, nameHash) === 0);
    if (!fileInfo) {
      return;
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

export async function parseSlpk(data: ArrayBuffer, options: I3SLoaderOptions = {}, context?) {
  const slpkArchieve = new DataView(data);

  const getAt = (offset: number) => {
    return slpkArchieve.getUint8(slpkArchieve.byteOffset + offset);
  };

  const searchWindow = [
    getAt(slpkArchieve.byteLength - 1),
    getAt(slpkArchieve.byteLength - 2),
    getAt(slpkArchieve.byteLength - 3),
    undefined
  ];

  let hashCDOffset = 0;

  for (let i = slpkArchieve.byteLength - 4; i > -1; i--) {
    // looking for the last record in the central directory
    searchWindow[3] = searchWindow[2];
    searchWindow[2] = searchWindow[1];
    searchWindow[1] = searchWindow[0];
    searchWindow[0] = getAt(i);
    if (searchWindow.toString().includes('80,75,1,2')) {
      hashCDOffset = i;
      break;
    }
  }

  const cdFileHeader = new CDFileHeader(hashCDOffset, slpkArchieve);

  const textDecoder = new TextDecoder();
  if (textDecoder.decode(cdFileHeader.getFileName()) !== '@specialIndexFileHASH128@') {
    throw new Error('No hash file in slpk');
  }

  const localFileHeader = new LocalFileHeader(cdFileHeader.getLocalHeaderOffset(), slpkArchieve);

  const fileDataOffset = localFileHeader.getFileDataOffset();
  const hashFile = slpkArchieve.buffer.slice(
    fileDataOffset,
    fileDataOffset + localFileHeader.getCompressedSize()
  );

  if (!hashFile) {
    throw new Error('No hash file in slpk');
  }

  return await new SlpkArchieve(data, hashFile).getFile(options.path ?? '');
}
