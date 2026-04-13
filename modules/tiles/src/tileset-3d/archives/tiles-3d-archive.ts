// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import {ZipArchive, parseZipArchive} from './zip-archive';

/**
 * Random-access helper for `.3tz` archives.
 */
export class Tiles3DArchive {
  private archive: ZipArchive;

  constructor(archive: ZipArchive) {
    this.archive = archive;
  }

  /**
   * Returns a file from the archive, trying lower-case names first to match `3tz` conventions.
   * @param archivePath Internal archive path.
   * @returns File contents.
   */
  async getFile(archivePath: string): Promise<ArrayBuffer> {
    const lowerCasePath = archivePath.toLocaleLowerCase();
    if (this.archive.getEntry(lowerCasePath)) {
      return await this.archive.getFile(lowerCasePath);
    }
    return await this.archive.getFile(archivePath);
  }
}

/**
 * Parses a `.3tz` archive into a random-access helper.
 * @param fileProvider Random-access file handle.
 * @returns Parsed archive helper.
 */
export async function parseTiles3DArchive(fileProvider: ReadableFile): Promise<Tiles3DArchive> {
  return new Tiles3DArchive(await parseZipArchive(fileProvider));
}
