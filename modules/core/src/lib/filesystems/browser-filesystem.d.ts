import {IFileSystem} from '@loaders.gl/loader-utils';

/**
 * FileSystem for browser FileList
 */
export default class BrowserFileSystem implements IFileSystem {
  /**
   * A FileSystem API wrapper around a list of browser 'File' objects
   * @param files
   * @param options
   */
  constructor(files: FileList | File[], options?: object);

  // implements IFileSystem
  fetch(filename: string, options?: object): Promise<Response>;
  readdir(dirname?: string): Promise<string[]>;
  stat(filename: string, options?: object): Promise<{size: number}>;

  // implements IRandomAccessFileSystem
  open(path: string, flags, mode?): Promise<number>;
  close(fd: number): Promise<void>;
  fstat(fd: number): Promise<object>; // Stat
  read(fd: number): Promise<any>;
}
