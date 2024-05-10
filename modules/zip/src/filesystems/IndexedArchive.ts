import {FileProviderInterface} from '@loaders.gl/loader-utils';
import {ZipFileSystem} from './zip-filesystem';

/**
 * Abstract class for fetching indexed archive formats (SLPK, 3TZ). Those types of zip archive has
 * a hash file inside that allows to increase reading speed
 */
export abstract class IndexedArchive {
  public fileProvider: FileProviderInterface;
  public fileName?: string;

  /**
   * Constructor
   * @param fileProvider - instance of a binary data reader
   * @param hashTable - pre-loaded hashTable. If presented, getFile will skip reading the hash file
   * @param fileName - name of the archive. It is used to add to an URL of a loader context
   */
  constructor(
    fileProvider: FileProviderInterface,
    hashTable?: Record<string, bigint>,
    fileName?: string
  ) {
    this.fileProvider = fileProvider;
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
    const zipFS = new ZipFileSystem(this.fileProvider);
    const response = await zipFS.fetch(filename);
    return await response.arrayBuffer();
  }
}
