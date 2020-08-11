/**
 * A loader defintion that can be used with `@loaders.gl/core` functions
 */
export type WorkerLoaderObject = {
  id: string,
  name: string,
  category?: string;
  version: string,
  extensions: string[],
  mimeTypes: string[],
  options: object;
  deprecatedOptions?: object;

  binary?: boolean;
  text?: boolean;

  test?: ((ArrayBuffer) => boolean) | string | number;

  // TODO - deprecated
  supported?: boolean;
  testText?: (string) => boolean;
};

export type LoaderObject = {
  id: string,
  name: string,
  category?: string;
  version: string,
  extensions: string[],
  mimeTypes: string[],
  options: object;
  deprecatedOptions?: object;

  binary?: boolean;
  text?: boolean;

  test?: ((ArrayBuffer) => boolean) | string | number | string[];

  parse: (arrayBuffer, options) => Promise<any>;
  parseSync?: (arrayBuffer, options) => any;
  parseText?: (string, options) => Promise<any>;
  parseTextSync?: (string, options) => any;
  parseInBatches?: (iterator: AsyncIterator<ArrayBuffer> | Iterator<ArrayBuffer>, options: object) => Promise<AsyncIterator<any>> | AsyncIterator<any>;

  // TODO - deprecated
  supported?: boolean;
  testText?: (string) => boolean;
};

/**
 * A writer defintion that can be used with `@loaders.gl/core` functions
 */
export type WriterObject = {
  options: object;
  deprecatedOptions?: object;

  encode(data: any, options: object): Promise<ArrayBuffer>
};

export type LoaderContext = {
  fetch?: any;
  loaders?: LoaderObject[];
  url?: string;

  parse?: (data: ArrayBuffer, options?: object) => Promise<any>;
  parseSync?: (data: ArrayBuffer, options?: object) => any;
  parseInBatches?: (data: AsyncIterator<any>, options?: object) => AsyncIterator<any>;
};

/** Types that can be synchronously parsed */
export type SyncDataType = string | ArrayBuffer; // TODO File | Blob can be read synchronously...

/** Types that can be parsed async */
export type DataType = string | ArrayBuffer | File | Blob | Response | ReadableStream;

/** Types that can be parsed in batches */
export type BatchableDataType =
  DataType |
  Iterable<ArrayBuffer> |
  AsyncIterable<ArrayBuffer> |
  Promise<AsyncIterable<ArrayBuffer>>;

/**
 * A FileSystem interface can encapsulate a FileList, a ZipFile, a GoogleDrive etc.
 */
export interface IFileSystem {
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
  fetch(filename: string, options?: object): Promise<Response>;
}

type ReadOptions = {buffer?: ArrayBuffer, offset?: number, length?: number, position?: number};
export interface IRandomAccessReadFileSystem extends IFileSystem {
  open(path: string, flags, mode?): Promise<any>;
  close(fd: any): Promise<void>;
  fstat(fd: any): Promise<object>;
  read(fd: any, options?: ReadOptions): Promise<{bytesRead: number, buffer: Buffer}>;
}
