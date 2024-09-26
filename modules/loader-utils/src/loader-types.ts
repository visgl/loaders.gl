// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  FetchLike,
  TransformBatches /* , DataType, SyncDataType, BatchableDataType */
} from './types';
import {ReadableFile} from './lib/files/file';

// LOADERS

/**
 * Core Loader Options
 */
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

  // module loading

  /** Any additional JS libraries */
  modules?: Record<string, any>;
  /** Force to load WASM libraries from local file system in NodeJS or from loaders.gl CDN in a web browser */
  useLocalLibraries?: boolean;

  // workers

  /** CDN load workers from */
  CDN?: string | null;
  /** Set to `false` to disable workers */
  worker?: boolean;
  /** Number of concurrent workers (per loader) on desktop browser */
  maxConcurrency?: number;
  /** Number of concurrent workers (per loader) on mobile browsers */
  maxMobileConcurrency?: number;
  /** Set to `false` to prevent reuse workers */
  reuseWorkers?: boolean;
  /** Whether to use workers under Node.js (experimental) */
  _nodeWorkers?: boolean;
  /** set to 'test' to run local worker */
  _workerType?: string;

  /** @deprecated `options.batchType` removed, Use `options.<loader>.type` instead */
  batchType?: 'row' | 'columnar' | 'arrow';
  /** @deprecated `options.throw removed`, Use `options.nothrow` instead */
  throws?: boolean;
  /** @deprecated `options.dataType` no longer used */
  dataType?: never;
  /** @deprecated `options.uri` no longer used */
  uri?: never;
  /** @deprecated Use `options.fetch.method` */
  method?: never;
  /** @deprecated Use `options.fetch.headers` */
  headers?: never;
  /** @deprecated Use `options.fetch.body` */
  body?: never;
  /** @deprecated Use `options.fetch.mode` */
  mode?: never;
  /** @deprecated Use `options.fetch.credentials` */
  credentials?: never;
  /** @deprecated Use `options.fetch.cache` */
  cache?: never;
  /** @deprecated Use `options.fetch.redirect` */
  redirect?: never;
  /** @deprecated Use `options.fetch.referrer` */
  referrer?: never;
  /** @deprecated Use `options.fetch.referrerPolicy` */
  referrerPolicy?: never;
  /** @deprecated Use `options.fetch.integrity` */
  integrity?: never;
  /** @deprecated Use `options.fetch.keepalive` */
  keepalive?: never;
  /** @deprecated Use `options.fetch.signal` */
  signal?: never;

  // Accept other keys (loader options objects, e.g. `options.csv`, `options.json` ...)
  [loaderId: string]: unknown;
};

type PreloadOptions = {
  [key: string]: unknown;
};

/**
 * A worker loader definition that can be used with `@loaders.gl/core` functions
 */
export type Loader<DataT = any, BatchT = any, LoaderOptionsT = LoaderOptions> = {
  /** The result type of this loader  */
  dataType?: DataT;
  /** The batched result type of this loader  */
  batchType?: BatchT;

  /** Default Options */
  options: LoaderOptionsT;
  /** Deprecated Options */
  deprecatedOptions?: Record<string, string | Record<string, string>>;

  /** Human readable name */
  name: string;
  /** id should be the same as the field used in LoaderOptions */
  id: string;
  /** module is used to generate worker threads, need to be the module directory name */
  module: string;
  /** Version should be injected by build tools */
  version: string;
  /** A boolean, or a URL */
  worker?: string | boolean;
  // end Worker

  /** Which category does this loader belong to */
  category?: string;
  /** File extensions that are potential matches with this loader. */
  extensions: string[];
  /** MIMETypes that indicate a match with this loader. @note Some MIMETypes are generic and supported by many loaders */
  mimeTypes: string[];

  /** Is the input of this loader binary */
  binary?: boolean;
  /** Is the input of this loader text */
  text?: boolean;

  /** Test some initial bytes of content to see if this loader might be a match */
  tests?: (((ArrayBuffer: ArrayBuffer) => boolean) | ArrayBuffer | string)[];

  /** @deprecated */
  supported?: boolean;
  /** @deprecated */
  testText?: (string: string) => boolean;
};

/**
 * A "bundled" loader definition that can be used with `@loaders.gl/core` functions
 * If a worker loader is supported it will also be supported.
 */
export type LoaderWithParser<DataT = any, BatchT = any, LoaderOptionsT = LoaderOptions> = Loader<
  DataT,
  BatchT,
  LoaderOptionsT
> & {
  /** Perform actions before load. @deprecated Not officially supported. */
  preload?: Preload;
  /** Parse asynchronously and atomically from an arraybuffer */
  parse: (
    arrayBuffer: ArrayBuffer,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => Promise<DataT>;
  /** Parse asynchronously and atomically from a random access "file like" input */
  parseFile?: (
    file: ReadableFile,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => Promise<DataT>;
  /** Parse synchronously and atomically from an arraybuffer */
  parseSync?: (
    arrayBuffer: ArrayBuffer,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => DataT;
  /** Parse batches of data from an iterator (e.g. fetch stream), return an iterator that yield parsed batches. */
  parseInBatches?: (
    iterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => AsyncIterable<BatchT>;
  /** For random access, file like sources, source that don't integrate with fetch. */
  parseFileInBatches?: (
    file: ReadableFile,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => AsyncIterable<BatchT>;

  /** Parse atomically from a string asynchronously */
  parseText?: (text: string, options?: LoaderOptionsT, context?: LoaderContext) => Promise<DataT>;
  /** Parse atomically from a string synchronously */
  parseTextSync?: (text: string, options?: LoaderOptionsT, context?: LoaderContext) => DataT;
};

/**
 * A Loader context is provided as a third parameters to a loader object's
 * parse functions when that loader is called by other loaders rather then
 * directly by the application.
 *
 * - The context object allows the subloaders to be aware of the parameters and
 *   options that the application provided in the top level call.
 * - The context also providedsaccess to parse functions so that the subloader
 *   does not need to include the core module.
 * - In addition, the context's parse functions may also redirect loads from worker
 *   threads back to main thread.
 */
export type LoaderContext = {
  /** Loader list provided to top-level loader call plus any sub loaders */
  loaders?: Loader[] | null;
  /** If URL is available.  */
  url?: string;
  /** the file name component of the URL (leading path and query string removed) */
  filename?: string;
  /** the directory name component of the URL (leading path excluding file name and query string) */
  baseUrl?: string;
  /** Query string (characters after `?`) */
  queryString?: string;

  /** Provides access to any application overrides of fetch() */
  fetch: typeof fetch | FetchLike;

  /** TBD */
  response?: Response;

  /**
   * Parse function for subloaders. Avoids importing `core`. In workers, may redirect to main thread
   */
  _parse: (
    arrayBuffer: ArrayBuffer,
    loaders?: Loader | Loader[] | LoaderOptions,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => Promise<any>;

  /**
   * ParseSync function. Avoids importing `core`. In workers, may redirect to main thread
   * @deprecated Do not call directly, use `parseSyncFromContext` instead
   */
  _parseSync?: (
    arrayBuffer: ArrayBuffer,
    loaders?: Loader | Loader[] | LoaderOptions,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => any;

  /**
   * ParseInBatches function. Avoids importing `core`.
   * @deprecated Do not call directly, use `parseInBatchesFromContext` instead
   */
  _parseInBatches?: (
    iterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer> | Response,
    loaders?: Loader | Loader[] | LoaderOptions,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => AsyncIterable<any> | Promise<AsyncIterable<any>>;
};

// type Parse = (
//   arrayBuffer: ArrayBuffer,
//   options?: LoaderOptions,
//   context?: LoaderContext
// ) => Promise<any>;
// type ParseSync = (
//   arrayBuffer: ArrayBuffer,
//   options?: LoaderOptions,
//   context?: LoaderContext
// ) => any;
// type ParseText = (text: string, options?: LoaderOptions) => Promise<any>;
// type ParseTextSync = (text: string, options?: LoaderOptions) => any;
// type ParseInBatches = (
//   iterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
//   options?: LoaderOptions,
//   context?: LoaderContext
// ) => AsyncIterable<any>;
// type ParseFileInBatches = (
//   file: Blob,
//   options?: LoaderOptions,
//   context?: LoaderContext
// ) => AsyncIterable<any>;

type Preload = (url: string, options?: PreloadOptions) => any;

/** Typescript helper to extract options type from a loader type */
export type LoaderOptionsType<T = Loader> =
  T extends Loader<any, any, infer Options> ? Options : never;
/** Typescript helper to extract data type from a loader type */
export type LoaderReturnType<T = Loader> =
  T extends Loader<infer Return, any, any> ? Return : never;
/** Typescript helper to extract batch type from a loader type */
export type LoaderBatchType<T = Loader> = T extends Loader<any, infer Batch, any> ? Batch : never;

/** Typescript helper to extract options type from an array of loader types */
export type LoaderArrayOptionsType<LoadersT extends Loader[] = Loader[]> =
  LoadersT[number]['options'];
/** Typescript helper to extract data type from a loader type */
export type LoaderArrayReturnType<LoadersT extends Loader[] = Loader[]> =
  LoadersT[number]['dataType'];
/** Typescript helper to extract batch type from a loader type */
export type LoaderArrayBatchType<LoadersT extends Loader[] = Loader[]> =
  LoadersT[number]['batchType'];

/**
 * Parses `data` asynchronously using the supplied loader, parse function provided via the loader context
 */
export async function parseFromContext<
  LoaderT extends Loader,
  OptionsT extends LoaderOptions = LoaderOptionsType<LoaderT>
>(
  data: ArrayBuffer,
  loader: LoaderT,
  options: OptionsT | undefined,
  context: LoaderContext
): Promise<LoaderReturnType<LoaderT>>;

/**
 * Parses `data` asynchronously by matching one of the supplied loader
 */
export async function parseFromContext(
  data: ArrayBuffer,
  loaders: Loader[],
  options: LoaderOptions | undefined,
  context: LoaderContext
): Promise<unknown>;

/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
// implementation signature
export async function parseFromContext(
  data: ArrayBuffer,
  loaders: Loader | Loader[],
  options: LoaderOptions | undefined,
  context: LoaderContext
): Promise<unknown> {
  return context._parse(data, loaders, options, context);
}

/**
 * Parses `data` synchronously using the specified loader, parse function provided via the loader context
 */
export function parseSyncFromContext<
  LoaderT extends Loader,
  OptionsT extends LoaderOptions = LoaderOptionsType<LoaderT>
>(
  data: ArrayBuffer,
  loader: LoaderT,
  options: OptionsT | undefined,
  context: LoaderContext
): LoaderReturnType<LoaderT> {
  if (!context._parseSync) {
    throw new Error('parseSync');
  }
  return context._parseSync(data, loader, options, context);
}

/**
 * Parses `data` synchronously using a specified loader, parse function provided via the loader context
 */
export async function parseInBatchesFromContext<
  LoaderT extends Loader,
  OptionsT extends LoaderOptions = LoaderOptionsType<LoaderT>
>(
  data: Iterable<ArrayBuffer> | AsyncIterable<ArrayBuffer> | Response,
  loader: LoaderT,
  options: OptionsT | undefined,
  context: LoaderContext
): Promise<AsyncIterable<LoaderBatchType<LoaderT>>> {
  if (!context._parseInBatches) {
    throw new Error('parseInBatches');
  }
  return context._parseInBatches(data, loader, options, context);
}
