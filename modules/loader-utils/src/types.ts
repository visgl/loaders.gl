// Typed arrays

export type TypedIntArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Int32Array
  | Uint32Array;

export type TypedFloatArray = Uint16Array | Float32Array | Float64Array;

export type TypedArray = TypedIntArray | TypedFloatArray;

export type NumericArray = Array<number> | TypedIntArray | TypedFloatArray;

// Core Loader Options
export type LoaderOptions = {
  fetch?: typeof fetch | RequestInit | null;

  // general
  log?: any;
  nothrow?: boolean;
  throws?: boolean;

  // batched parsing
  metadata?: boolean;
  transforms?: any[];

  // workers
  CDN?: string;
  worker?: boolean;
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  reuseWorkers?: boolean;
  _workerType?: string;

  // [loaderId: string]: any;
};

export type CoreWriterOptions = {
  [key: string]: any;
};

/**
 * A worker loader definition that can be used with `@loaders.gl/core` functions
 */
export type Loader = {
  // Worker
  name: string;
  id: string;
  module: string;
  version: string;
  worker?: string | boolean;
  options: object;
  deprecatedOptions?: object;
  // end Worker

  category?: string;
  extensions: string[];
  mimeTypes: string[];

  binary?: boolean;
  text?: boolean;

  tests?: (((ArrayBuffer) => boolean) | ArrayBuffer | string)[];

  // TODO - deprecated
  supported?: boolean;
  testText?: (string) => boolean;
};

/**
 * A "bundled" loader definition that can be used with `@loaders.gl/core` functions
 * If a worker loader is supported it will also be supported.
 */
export type LoaderWithParser = Loader & {
  // TODO - deprecated
  testText?: (string) => boolean;

  parse: Parse;
  parseSync?: ParseSync;
  parseText?: ParseText;
  parseTextSync?: ParseTextSync;
  parseInBatches?: ParseInBatches;
};

/**
 * A writer definition that can be used with `@loaders.gl/core` functions
 */
export type Writer = {
  name: string;

  id: string;
  module: string;
  version: string;

  options: object;
  deprecatedOptions?: object;

  // TODO - are these are needed?
  binary?: boolean;
  extensions?: string[];
  mimeTypes?: string[];
  text?: boolean;

  encode?: Encode;
  encodeSync?: EncodeSync;
  encodeInBatches?: EncodeInBatches;
  encodeURLtoURL?: EncodeURLtoURL;
  encodeText?: EncodeText;
};

export type LoaderContext = {
  fetch?: typeof fetch;
  loaders?: Loader[] | null;
  url?: string;

  parse?: Parse;
  parseSync?: ParseSync;
  parseInBatches?: ParseInBatches;
};

type Parse = (
  arrayBuffer: ArrayBuffer,
  options?: LoaderOptions,
  context?: LoaderContext
) => Promise<any>;
type ParseSync = (
  arrayBuffer: ArrayBuffer,
  options?: LoaderOptions,
  context?: LoaderContext
) => any;
type ParseText = (string, options?: LoaderOptions) => Promise<any>;
type ParseTextSync = (string: string, options?: LoaderOptions) => any;
type ParseInBatches = (
  iterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: LoaderOptions,
  context?: LoaderContext
) => AsyncIterable<any>;

type Encode = (data: any, options?: CoreWriterOptions) => Promise<ArrayBuffer>;
type EncodeSync = (data: any, options?: CoreWriterOptions) => ArrayBuffer;
// TODO
type EncodeText = Function;
type EncodeInBatches = Function;
type EncodeURLtoURL = (
  inputUrl: string,
  outputUrl: string,
  options?: CoreWriterOptions
) => Promise<string>;

/** Types that can be synchronously parsed */
export type SyncDataType = string | ArrayBuffer; // TODO File | Blob can be read synchronously...

/** Types that can be parsed async */
export type DataType =
  | string
  | ArrayBuffer
  | File
  | Blob
  | Response
  | ReadableStream
  | Iterable<ArrayBuffer>
  | AsyncIterable<ArrayBuffer>;

/** Types that can be parsed in batches */
export type BatchableDataType =
  | DataType
  | Iterable<ArrayBuffer>
  | AsyncIterable<ArrayBuffer>
  | Promise<AsyncIterable<ArrayBuffer>>;

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

type ReadOptions = {buffer?: ArrayBuffer; offset?: number; length?: number; position?: number};
export interface IRandomAccessReadFileSystem extends IFileSystem {
  open(path: string, flags, mode?): Promise<any>;
  close(fd: any): Promise<void>;
  fstat(fd: any): Promise<object>;
  read(fd: any, options?: ReadOptions): Promise<{bytesRead: number; buffer: Buffer}>;
}
