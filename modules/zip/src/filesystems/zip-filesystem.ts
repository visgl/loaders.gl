// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FileSystem, isBrowser, BlobFile, NodeFile} from '@loaders.gl/loader-utils';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import {ZipCDFileHeader, makeZipCDHeaderIterator} from '../parse-zip/cd-file-header';
import {parseZipLocalFileHeader} from '../parse-zip/local-file-header';
import {DeflateCompression} from '@loaders.gl/compression';
import {IndexedArchive} from './IndexedArchive';
import {readRange} from '../parse-zip/readable-file-utils';

export type CompressionHandler = (compressedFile: ArrayBuffer) => Promise<ArrayBuffer>;
/** Handling different compression types in zip */
export const ZIP_COMPRESSION_HANDLERS: {[key: number]: CompressionHandler} = {
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
 * FileSystem adapter for a ZIP file
 * Holds a ReadableFile object that provides random access to archived files
 */
export class ZipFileSystem implements FileSystem {
  /** File instance */
  public file: ReadableFile | null = null;
  public fileName?: string;
  public archive: IndexedArchive | null = null;

  /**
   * Constructor
   * @param file - instance of ReadableFile or file path string
   */
  constructor(file: ReadableFile | IndexedArchive | string | Blob | ArrayBuffer) {
    // Try to open file in NodeJS
    if (typeof file === 'string') {
      this.fileName = file;
      if (isBrowser) {
        throw new Error('ZipFileSystem cannot open file paths in browser environments');
      }
      this.file = new NodeFile(file);
    } else if (file instanceof Blob || file instanceof ArrayBuffer) {
      this.file = new BlobFile(file);
    } else if (file instanceof IndexedArchive) {
      this.file = file.file;
      this.archive = file;
      this.fileName = file.fileName;
    } else {
      this.file = file;
    }
  }

  /** Clean up resources */
  async destroy() {
    if (this.file) {
      await this.file.close();
    }
  }

  /**
   * Get file names list from zip archive
   * @returns array of file names
   */
  async readdir(): Promise<string[]> {
    if (!this.file) {
      throw new Error('No data detected in the zip archive');
    }
    const fileNames: string[] = [];
    const zipCDIterator = makeZipCDHeaderIterator(this.file);
    for await (const cdHeader of zipCDIterator) {
      fileNames.push(cdHeader.fileName);
    }
    return fileNames;
  }

  /**
   * Get file metadata
   * @param filename - name of a file
   * @returns central directory data
   */
  async stat(filename: string): Promise<ZipCDFileHeader & {size: number}> {
    const cdFileHeader = await this.getCDFileHeader(filename);
    return {...cdFileHeader, size: Number(cdFileHeader.uncompressedSize)};
  }

  /**
   * Implementation of fetch against this file system
   * @param filename - name of a file
   * @returns - Response with file data
   */
  async fetch(filename: string): Promise<Response> {
    if (this.fileName && filename.indexOf(this.fileName) === 0) {
      filename = filename.substring(this.fileName.length + 1);
    }

    let uncompressedFile: ArrayBuffer;
    if (this.archive) {
      uncompressedFile = await this.archive.getFile(filename, 'http');
    } else {
      if (!this.file) {
        throw new Error('No data detected in the zip archive');
      }
      const cdFileHeader = await this.getCDFileHeader(filename);
      const localFileHeader = await parseZipLocalFileHeader(
        cdFileHeader.localHeaderOffset,
        this.file
      );
      if (!localFileHeader) {
        throw new Error('Local file header has not been found in the zip archive`');
      }

      const compressionHandler =
        ZIP_COMPRESSION_HANDLERS[localFileHeader.compressionMethod.toString()];
      if (!compressionHandler) {
        throw Error('Only Deflation compression is supported');
      }

      const compressedFile = await readRange(
        this.file,
        localFileHeader.fileDataOffset,
        localFileHeader.fileDataOffset + localFileHeader.compressedSize
      );

      uncompressedFile = await compressionHandler(compressedFile);
    }

    const response = new Response(uncompressedFile);
    Object.defineProperty(response, 'url', {
      value: filename ? `${this.fileName || ''}/${filename}` : this.fileName || ''
    });
    return response;
  }

  /**
   * Get central directory file header
   * @param filename - name of a file
   * @returns central directory file header
   */
  private async getCDFileHeader(filename: string): Promise<ZipCDFileHeader> {
    if (!this.file) {
      throw new Error('No data detected in the zip archive');
    }
    const zipCDIterator = makeZipCDHeaderIterator(this.file);
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
