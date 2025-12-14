import type {ReadableFile} from '@loaders.gl/loader-utils';
import {ZipFileSystem} from './zip-filesystem';

/**
 * Abstract class for fetching indexed archive formats (SLPK, 3TZ). Those types of zip archive has
 * a hash file inside that allows to increase reading speed
 */
export abstract class IndexedArchive {
  public file: ReadableFile;
  public fileName?: string;

  /**
   * Constructor
   * @param fileProvider - readable file instance for random access
   * @param hashTable - pre-loaded hashTable. If presented, getFile will skip reading the hash file
   * @param fileName - name of the archive. It is used to add to an URL of a loader context
   */
  constructor(file: ReadableFile, hashTable?: Record<string, bigint>, fileName?: string) {
    this.file = file;
    this.fileName = fileName;
  }

  /**
   * Get internal file from the archive
   * @param path - path to the file
   * @param mode - path mode - the logic is implemented in subclasses
   */
  abstract getFile(path: string, mode?: string): Promise<ArrayBuffer>;

  /**
   * Get file as from order ZIP arhive without using the hash file
   * @param filename - path to the internal file
   * @returns
   */
  protected async getFileWithoutHash(filename: string): Promise<ArrayBuffer> {
    const zipFS = new ZipFileSystem(this.file);
    const response = await zipFS.fetch(filename);
    return await response.arrayBuffer();
  }
}
