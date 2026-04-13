// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import {inflateBuffer, ZipArchive, parseZipArchive} from './zip-archive';

const PATH_DESCRIPTIONS: {test: RegExp; extensions: string[]}[] = [
  {test: /^$/, extensions: ['3dSceneLayer.json.gz']},
  {test: /nodepages\/\d+$/, extensions: ['.json.gz']},
  {test: /sublayers\/\d+$/, extensions: ['/3dSceneLayer.json.gz']},
  {test: /nodes\/(\d+|root)$/, extensions: ['/3dNodeIndexDocument.json.gz']},
  {test: /nodes\/\d+\/textures\/.+$/, extensions: ['.jpg', '.png', '.bin.dds.gz', '.ktx', '.ktx2']},
  {test: /nodes\/\d+\/geometries\/\d+$/, extensions: ['.bin.gz', '.draco.gz']},
  {test: /nodes\/\d+\/attributes\/f_\d+\/\d+$/, extensions: ['.bin.gz']},
  {test: /statistics\/(f_\d+\/\d+|summary)$/, extensions: ['.json.gz']},
  {test: /nodes\/\d+\/shared$/, extensions: ['/sharedResource.json.gz']}
];

/**
 * Random-access helper for `.slpk` archives.
 */
export class SLPKArchive {
  private archive: ZipArchive;

  constructor(archive: ZipArchive) {
    this.archive = archive;
  }

  /**
   * Returns a decompressed file from the archive.
   * @param archivePath Internal archive path.
   * @param mode Access mode.
   * @returns File contents.
   */
  async getFile(archivePath: string, mode: 'http' | 'raw' = 'raw'): Promise<ArrayBuffer> {
    if (mode === 'http') {
      const extensions = PATH_DESCRIPTIONS.find(value => value.test.test(archivePath))?.extensions;
      if (extensions) {
        for (const extension of extensions) {
          const data = await this.getDataByPath(`${archivePath}${extension}`);
          if (data) {
            return data;
          }
        }
      }
    }

    if (mode === 'raw') {
      const decompressedFile = await this.getDataByPath(`${archivePath}.gz`);
      if (decompressedFile) {
        return decompressedFile;
      }

      if (this.archive.getEntry(archivePath.toLocaleLowerCase())) {
        return await this.archive.getFile(archivePath.toLocaleLowerCase());
      }
      return await this.archive.getFile(archivePath);
    }

    throw new Error(`No such file in the archive: ${archivePath}`);
  }

  private async getDataByPath(archivePath: string): Promise<ArrayBuffer | undefined> {
    const lowerCasePath = archivePath.toLocaleLowerCase();
    const normalizedPath = this.archive.getEntry(lowerCasePath) ? lowerCasePath : archivePath;
    if (!this.archive.getEntry(normalizedPath)) {
      return undefined;
    }

    const data = await this.archive.getFile(normalizedPath);
    if (/\.gz$/.test(normalizedPath)) {
      return await inflateBuffer(data, 'gzip');
    }
    return data;
  }
}

/**
 * Parses an `.slpk` archive into a random-access helper.
 * @param fileProvider Random-access file handle.
 * @returns Parsed archive helper.
 */
export async function parseSLPKArchive(fileProvider: ReadableFile): Promise<SLPKArchive> {
  return new SLPKArchive(await parseZipArchive(fileProvider));
}
