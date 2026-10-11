// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import {IndexedArchive, type ZipArchiveOptions} from '@loaders.gl/zip';

/**
 * Class for handling information about 3tz file
 */
export class Tiles3DArchive extends IndexedArchive {
  /**
   * creates Tiles3DArchive handler
   * @param fileProvider - readable file handle with the whole archive
   * @param hashTable - hash info
   */
  constructor(
    fileProvider: ReadableFile,
    hashTable?: Record<string, bigint>,
    fileName?: string,
    options?: ZipArchiveOptions
  ) {
    super(fileProvider, hashTable, fileName, options);
  }

  /**
   * Returns file with the given path from 3tz archive
   * @param path - path inside the 3tz
   * @returns buffer with ready to use file
   */
  async getFile(path: string): Promise<ArrayBuffer> {
    // sometimes paths are not in lower case when hash file is created,
    // so first we're looking for lower case file name and then for original one
    let data = await this.getFileBytes(path.toLocaleLowerCase());
    if (!data) {
      data = await this.getFileBytes(path);
    }
    if (!data) {
      throw new Error(`No such file in the archive: ${path}`);
    }

    return data;
  }

  /**
   * Trying to get raw file data by adress
   * @param path - path inside the archive
   * @returns buffer with the raw file data
   */
  private async getFileBytes(path: string): Promise<ArrayBuffer | null> {
    return (await this.readZipEntry(path)) ?? null;
  }
}
