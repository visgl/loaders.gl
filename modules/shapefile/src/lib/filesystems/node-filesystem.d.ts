import {IFileSystem, IRandomAccessReadFileSystem} from '@loaders.gl/loader-utils';

type Stat = {
  size: number;
  isDirectory: () => boolean;
};

type ReadOptions = {buffer?: ArrayBuffer; offset?: number; length?: number; position?: number};

/**
 * FileSystem pass-through for Node.js
 * - Provides promisified versions of Node `fs` API
 * - Type compatible with BrowserFileSystem.
 */
export default class NodeFileSystem implements IFileSystem, IRandomAccessReadFileSystem {
  /**
   * @param options
   */
  constructor(options?: object);

  // implements IFileSystem
  fetch(path: string, options?: object): Promise<Response>;
  readdir(path?: string): Promise<string[]>;
  stat(path: string, options?: object): Promise<Stat>;

  // implements IRandomAccessFileSystem
  open(path: string, flags, mode?): Promise<number>;
  close(fd: number): Promise<void>;
  fstat(fd: number): Promise<Stat>;
  read(fd: number, options: ReadOptions): Promise<{bytesRead: number; buffer: Buffer}>;
}
