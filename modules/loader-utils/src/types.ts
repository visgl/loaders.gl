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

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

// Core Loader Options
export type LoaderOptions = {
  /** fetch options or a custom fetch function */
  fetch?: typeof fetch | FetchLike | RequestInit | null;
  /** Do not throw on errors */
  nothrow?: boolean;

  /** loader selection, search first for supplied mimeType */
  mimeType?: string;
  /** loader selection, provide fallback mimeType is server does not provide */
  fallbackMimeType?: string;
  /** loader selection, avoid searching registered loaders */
  ignoreRegisteredLoaders?: boolean;

  // general
  /** Experimental: Supply a logger to the parser */
  log?: any;

  // batched parsing

  /** Size of each batch. `auto` matches batches to size of incoming chunks */
  batchSize?: number | 'auto';
  /** Minimal amount of time between batches */
  batchDebounceMs?: number;
  /** Stop loading after a given number of rows (compare SQL limit clause) */
  limit?: 0;
  /** Experimental: Stop loading after reaching */
  _limitMB?: 0;
  /** Generate metadata batches */
  metadata?: boolean;
  /** Transforms to run on incoming batches */
  transforms?: TransformBatches[];

  // workers

  /** CDN load workers from */
  CDN?: string;
  /** Set to `false` to disable workers */
  worker?: boolean;
  /** Number of concurrent workers (per loader) on desktop browser */
  maxConcurrency?: number;
  /** Number of concurrent workers (per loader) on mobile browsers */
  maxMobileConcurrency?: number;
  /** Set to `false` to prevent reuse workers */
  reuseWorkers?: boolean;
  /** set to 'test' to run worker type */
  _workerType?: string;

  /** @deprecated `options.batchType` removed, Use `options.<loader>.type` instead */
  batchType?: 'row' | 'columnar' | 'arrow';
  /** @deprecated `options.throw removed`, Use `options.nothrow` instead */
  throws?: boolean;
  /** @deprecated `options.dataType` no longer used */
  dataType?: any;
  /** @deprecated `options.uri` no longer used */
  uri?: any;
  /** @deprecated `options.method` removed. Use `options.fetch.method` */
  method?: any;
  /** @deprecated `options.headers` removed. Use `options.fetch.headers` */
  headers?: any;
  /** @deprecated `options.body` removed. Use `options.fetch.body` */
  body?: any;
  /** @deprecated `options.mode` removed. Use `options.fetch.mode` */
  mode?: any;
  /** @deprecated `options.credentials` removed. Use `options.fetch.credentials` */
  credentials?: any;
  /** @deprecated `options.cache` removed. Use `options.fetch.cache` */
  cache?: any;
  /** @deprecated `options.redirect` removed. Use `options.fetch.redirect` */
  redirect?: any;
  /** @deprecated `options.referrer` removed. Use `options.fetch.referrer` */
  referrer?: any;
  /** @deprecated `options.referrerPolicy` removed. Use `options.fetch.referrerPolicy` */
  referrerPolicy?: any;
  /** @deprecated `options.integrity` removed. Use `options.fetch.integrity` */
  integrity?: any;
  /** @deprecated `options.keepalive` removed. Use `options.fetch.keepalive` */
  keepalive?: any;
  /** @deprecated `options.signal` removed. Use `options.fetch.signal` */
  signal?: any;

  // Accept other keys (loader options objects, e.g. `options.csv`, `options.json` ...)
  [loaderId: string]: any;
};

type PreloadOptions = {
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
  preload?: Preload;
  parseSync?: ParseSync;
  parseText?: ParseText;
  parseTextSync?: ParseTextSync;
  parseInBatches?: ParseInBatches;
};

/** Options for writers */
export type WriterOptions = {};

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
  loaders?: Loader[] | null;
  url?: string;

  fetch: typeof fetch;
  parse: (
    arrayBuffer: ArrayBuffer,
    loaders?,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => Promise<any>;
  parseSync?: (
    arrayBuffer: ArrayBuffer,
    loaders?,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => any;
  parseInBatches?: (
    iterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    loaders?,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => AsyncIterable<any>;
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
type ParseText = (text: string, options?: LoaderOptions) => Promise<any>;
type ParseTextSync = (text: string, options?: LoaderOptions) => any;
type ParseInBatches = (
  iterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: LoaderOptions,
  context?: LoaderContext
) => AsyncIterable<any>;

type Encode = (data: any, options?: WriterOptions) => Promise<ArrayBuffer>;
type EncodeSync = (data: any, options?: WriterOptions) => ArrayBuffer;
// TODO
type EncodeText = Function;
type EncodeInBatches = Function;
type EncodeURLtoURL = (
  inputUrl: string,
  outputUrl: string,
  options?: WriterOptions
) => Promise<string>;
type Preload = (url: string, options?: PreloadOptions) => any;

export type TransformBatches = (
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
) => AsyncIterable<ArrayBuffer>;

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
