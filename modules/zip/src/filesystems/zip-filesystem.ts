import {FileSystem, isBrowser} from '@loaders.gl/core';
import {FileProvider, isFileProvider} from '../classes/file-provider';
import {FileHandleFile} from '../classes/file-handle-file';
import {ZipCDFileHeader, zipCDFileHeaderGenerator} from '../parse-zip/cd-file-header';
import {parseZipLocalFileHeader} from '../parse-zip/local-file-header';

type CompressionHandler = (compressedFile: ArrayBuffer) => Promise<ArrayBuffer>;
/** Handling different compression types in zip */
const COMPRESSION_METHODS: {[key: number]: CompressionHandler} = {
  /** No compression */
  0: async (compressedFile) => compressedFile
};

export class ZipFileSystem implements FileSystem {
  private fileProvider: Promise<FileProvider | null> = Promise.resolve(null);

  constructor(file: FileProvider | string) {
    // Try to open file in NodeJS
    if (typeof file === 'string') {
      if (!isBrowser) {
        this.fileProvider = FileHandleFile.from(file);
      } else {
        throw new Error('Cannot open file for random access in a WEB browser');
      }
    } else if (isFileProvider(file)) {
      this.fileProvider = Promise.resolve(file);
    }
  }

  async destroy() {
    const fileProvider = await this.fileProvider;
    if (fileProvider) {
      fileProvider.destroy();
    }
  }

  async readdir(): Promise<string[]> {
    const fileProvider = await this.fileProvider;
    if (!fileProvider) {
      throw new Error('No data detected in the zip archive');
    }
    const fileNames: string[] = [];
    const zipCDIterator = zipCDFileHeaderGenerator(fileProvider);
    for await (const cdHeader of zipCDIterator) {
      fileNames.push(cdHeader.fileName);
    }
    return fileNames;
  }

  async stat(filename: string): Promise<ZipCDFileHeader & {size: number}> {
    const cdFileHeader = await this.getCDFileHeader(filename);
    return {...cdFileHeader, size: Number(cdFileHeader.uncompressedSize)};
  }

  async fetch(filename: string, options?: RequestInit | undefined): Promise<Response> {
    const fileProvider = await this.fileProvider;
    if (!fileProvider) {
      throw new Error('No data detected in the zip archive');
    }
    const cdFileHeader = await this.getCDFileHeader(filename);
    const localFileHeader = await parseZipLocalFileHeader(
      cdFileHeader.localHeaderOffset,
      fileProvider
    );
    if (!localFileHeader) {
      throw new Error('Local file header has not been found in the zip archive`');
    }

    const compressionHandler = COMPRESSION_METHODS[localFileHeader.compressionMethod.toString()];
    if (!compressionHandler) {
      throw Error('Only Deflation compression is supported');
    }

    const compressedFile = await fileProvider.slice(
      localFileHeader.fileDataOffset,
      localFileHeader.fileDataOffset + localFileHeader.compressedSize
    );

    const uncompressedFile = await compressionHandler(compressedFile);

    const response = new Response(uncompressedFile);
    return response;
  }

  private async getCDFileHeader(filename: string): Promise<ZipCDFileHeader> {
    const fileProvider = await this.fileProvider;
    if (!fileProvider) {
      throw new Error('No data detected in the zip archive');
    }
    const zipCDIterator = zipCDFileHeaderGenerator(fileProvider);
    let result: ZipCDFileHeader | null = null;
    for await (const cdHeader of zipCDIterator) {
      if (cdHeader.fileName === filename) {
        result = cdHeader;
        break;
      }
    }
    if (!result) {
      throw new Error('File has not been found in the zip archive');
    }
    return result;
  }
}
