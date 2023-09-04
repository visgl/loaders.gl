// loaders.gl, MIT license

export type ReadOptions = {};

export type Stat = {
  size: number;
  isDirectory: () => boolean;
};

/**
 * A FileSystem interface can encapsulate various file sources,
 * a FileList, a ZipFile, a GoogleDrive etc.
 */
export interface FileSystem {
  /**
   * Return a list of file names
   * @param dirname directory name. file system root directory if omitted
   */
  readdir(dirname?: string, options?: {recursive?: boolean}): Promise<string[]>;

  /**
   * Gets information from a local file from the filesystem
   * @param filename file name to stat
   * @param options currently unused
   * @throws if filename is not in local filesystem
   */
  stat(filename: string, options?: object): Promise<{size: number}>;

  /**
   * Fetches a local file from the filesystem (or a URL)
   * @param filename
   * @param options
   */
  fetch(filename: RequestInfo, options?: RequestInit): Promise<Response>;
}

/**
 * A random access file system
 */
export interface RandomAccessReadFileSystem extends FileSystem {
  open(path: string, flags: unknown, mode?: unknown): Promise<any>;
  close(fd: unknown): Promise<void>;
  fstat(fd: unknown): Promise<Stat>;
  read(fd: any, options?: ReadOptions): Promise<{bytesRead: number; buffer: Buffer}>;
  // read(
  //   fd: any,
  //   buffer: ArrayBuffer | ArrayBufferView,
  //   offset?: number,
  //   length?: number,
  //   position?: number
  // ): Promise<{bytesRead: number; buffer: ArrayBuffer}>;
}

/**
 * A FileSystem interface can encapsulate a FileList, a ZipFile, a GoogleDrive etc.
 *
export interface IFileSystem {
  /**
   * Return a list of file names
   * @param dirname directory name. file system root directory if omitted
   *
  readdir(dirname?: string, options?: {recursive?: boolean}): Promise<string[]>;

  /**
   * Gets information from a local file from the filesystem
   * @param filename file name to stat
   * @param options currently unused
   * @throws if filename is not in local filesystem
   *
  stat(filename: string, options?: object): Promise<{size: number}>;

  /**
   * Fetches a local file from the filesystem (or a URL)
   * @param filename
   * @param options
   *
  fetch(filename: string, options?: object): Promise<Response>;
}

type ReadOptions = {buffer?: ArrayBuffer; offset?: number; length?: number; position?: number};
export interface IRandomAccessReadFileSystem extends IFileSystem {
  open(path: string, flags: string | number, mode?: any): Promise<any>;
  close(fd: any): Promise<void>;
  fstat(fd: any): Promise<object>;
  read(fd: any, options?: ReadOptions): Promise<{bytesRead: number; buffer: Buffer}>;
}
*/
