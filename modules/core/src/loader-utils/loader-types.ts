// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {Logger} from 'probe.gl/log';

import type {Format} from './format-types';
import type {LoadWorker, WorkerOptions, WorkerProgress} from '@loaders.gl/core/worker-utils';
import {DataType, FetchLike, TransformBatches} from './types';
import {ReadableFile} from './lib/files/file';
import type {CoreAPI} from './lib/sources/data-source';
import type {Credential, AuthenticationConstructor} from './lib/request-utils/authentication';
import type {QueryOptions} from './lib/scan-utils/query-options';

/** Query parameters appended to URL-backed loader requests. */
export type SearchParams = Record<string, string | number | boolean>;

// LOADERS

/**
 * Core Loader Options
 */
export type StrictLoaderOptions = Pick<WorkerOptions, 'signal' | 'onProgress'> & {
  /** Common query request. Format loaders implement the fields they support. */
  _scan?: QueryOptions;
  /** Query parameters appended to the initial URL request. */
  searchParams?: SearchParams;
  core?: {
    /** Base URL for resolving relative paths */
    baseUrl?: string;
    /** fetch options or a custom fetch function */
    fetch?: typeof fetch | FetchLike | RequestInit | null;
    /** Exact-origin credentials applied to top-level and nested requests. */
    credentials?: readonly Credential[];
    /** Authentication classes used to instantiate typed entries in `credentials`. */
    authentications?: readonly AuthenticationConstructor[];
    /** Do not throw on errors */
    nothrow?: boolean;
    /** Shared default shape for loaders that support shape selection. Loader-scoped `shape` options override this default. */
    shape?: string;

    /** loader selection, search first for supplied mimeType */
    mimeType?: string;
    /** loader selection, provide fallback mimeType is server does not provide */
    fallbackMimeType?: string;
    /** loader selection, avoid searching registered loaders */
    ignoreRegisteredLoaders?: boolean;

    // general
    /** Experimental: Supply a logger to the parser */
    log?: Logger | null;

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

    /** Shared named loader replacements forwarded through recursive dependency preparation and parsing. */
    subloaders?: Readonly<Record<string, Loader>>;

    /** Force to load WASM libraries from local file system in NodeJS or from loaders.gl CDN in a web browser */
    useLocalLibraries?: boolean;

    // workers

    /** CDN load workers from */
    CDN?: string | null;
    /** Set to `false` to disable workers, or `'auto'` to use loader work estimates. */
    worker?: boolean | 'auto';
    /** Declares batch support for a custom worker URL, or disables batch offloading. The loader must also advertise workerInBatches. */
    workerInBatches?: boolean;
    /** Work-score threshold used by `worker: 'auto'`. */
    workerThreshold?: number;
    /** Number of concurrent workers (per loader) on desktop browser */
    maxConcurrency?: number;
    /** Number of concurrent workers (per loader) on mobile browsers */
    maxMobileConcurrency?: number;
    /** @deprecated Task handles close after each atomic call or stream. */
    reuseWorkers?: boolean;
    /** Controls whether worker result transfer prepares standalone ArrayBuffers. */
    workerTransferBufferCopy?: 'none' | 'sliced' | 'all';
    /** Whether to use workers under Node.js (experimental) */
    _nodeWorkers?: boolean;
    /** set to 'test' to run local worker */
    _workerType?: string;
  };

  /** Any additional JS libraries */
  modules?: Record<string, unknown>;

  // Accept other keys (loader options objects, e.g. `options.csv`, `options.json` ...)
  [loaderId: string]:
    | Record<string, unknown>
    | AbortSignal
    | ((progress: WorkerProgress) => void)
    | undefined;
};

/**
 * Core Loader Options
 */
export type LoaderOptions = Pick<WorkerOptions, 'signal' | 'onProgress'> & {
  /** Common query request. Format loaders implement the fields they support. */
  _scan?: QueryOptions;
  /** Query parameters appended to the initial URL request. */
  searchParams?: SearchParams;
  core?: StrictLoaderOptions['core'];
  modules?: StrictLoaderOptions['modules'];

  // Deprecated top-level aliases for core options
  /** @deprecated Use options.core.baseUrl */
  baseUri?: string;
  /** @deprecated Use options.core.fetch */
  fetch?: typeof fetch | FetchLike | RequestInit | null;
  /** @deprecated Use options.core.mimeType */
  mimeType?: string;
  /** @deprecated Use options.core.fallbackMimeType */
  fallbackMimeType?: string;
  /** @deprecated Use options.core.ignoreRegisteredLoaders */
  ignoreRegisteredLoaders?: boolean;
  /** @deprecated Use options.core.nothrow */
  nothrow?: boolean;
  /** @deprecated Use options.core.log */
  log?: Logger | null;
  /** @deprecated Use options.core.useLocalLibraries */
  useLocalLibraries?: boolean;
  /** @deprecated Use options.core.CDN */
  CDN?: string | null;
  /** @deprecated Use options.core.worker */
  worker?: boolean | 'auto';
  /** @deprecated Use options.core.maxConcurrency */
  maxConcurrency?: number;
  /** @deprecated Use options.core.maxMobileConcurrency */
  maxMobileConcurrency?: number;
  /** @deprecated Task handles close after each atomic call or stream. */
  reuseWorkers?: boolean;
  /** @deprecated Use options.core.workerTransferBufferCopy */
  workerTransferBufferCopy?: 'none' | 'sliced' | 'all';
  /** @deprecated Use options.core._nodeWorkers */
  _nodeWorkers?: boolean;
  /** @deprecated Use options.core._workerType */
  _workerType?: string;
  /** @deprecated Use options.core._workerType */
  _worker?: string;
  /** @deprecated Use options.core.limit */
  limit?: 0;
  /** @deprecated Use options.core._limitMB */
  _limitMB?: 0;
  /** @deprecated Use options.core.shape */
  shape?: string;
  /** @deprecated Use options.core.batchSize */
  batchSize?: number | 'auto';
  /** @deprecated Use options.core.batchDebounceMs */
  batchDebounceMs?: number;
  /** @deprecated Use options.core.metadata */
  metadata?: boolean;
  /** @deprecated Use options.core.transforms */
  transforms?: TransformBatches[];

  // Accept other keys (loader options objects, e.g. `options.csv`, `options.json` ...)
  [loaderId: string]: unknown;
};

type PreloadOptions = {
  [key: string]: unknown;
};

/**
 * A worker loader definition that can be used with `@loaders.gl/core` functions
 */
export type Loader<DataT = any, BatchT = any, LoaderOptionsT = StrictLoaderOptions> = Format & {
  /** The result type of this loader  */
  dataType?: DataT;
  /** The batched result type of this loader  */
  batchType?: BatchT;

  /**
   * Named metadata loaders used by this loader or source.
   * Worker loaders declare nested decoders here so the caller can resolve their identifiers
   * without transferring parser or preload functions between threads.
   */
  subloaders?: Readonly<Record<string, Loader>>;

  /** Default public output shape applied by the core parse and load APIs. */
  defaultShape?: string;

  /** Default Options */
  options: LoaderOptionsT;
  /** Deprecated Options */
  deprecatedOptions?: Record<string, string | Record<string, string>>;
  /** Version should be injected by build tools */
  version: string;
  /** A boolean, or a URL */
  worker?: string | boolean;
  /** Whether the worker and its batch transport support this loader's batch parser. */
  workerInBatches?: boolean;
  /** Browser worker filename when it differs from the loader id. */
  workerFile?: string;
  /** Optional Node.js worker filename, such as a CommonJS `.cjs` bundle. */
  workerNode?: string;
  /** Repository-relative source path for a Node test worker after package grouping. */
  workerSourceNode?: string;
  /** Creates a built-in browser worker, typically using `type: 'module'`. */
  loadWorker?: LoadWorker;
  /**
   * Optionally warm the loader before parse/load is invoked.
   * Can be used to avoid a later delay and may return a parser-bearing loader that also supports `parseSync`.
   */
  preload?: Preload;
  /** Contributes authentication constructors before requests; application constructors take precedence. */
  getAuthentications?: (
    url: string,
    options: LoaderOptions
  ) => readonly AuthenticationConstructor[] | Promise<readonly AuthenticationConstructor[]>;
  /** Converts loader-specific option values to portable data before worker dispatch. Must not mutate options. */
  serializeWorkerOptions?: (options: LoaderOptionsT) => LoaderOptions;
  /** Serializes parser output before returning it from a worker. */
  serializeWorkerResult?: (
    result: DataT,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => unknown;
  /** Deserializes parser output returned from a worker. */
  deserializeWorkerResult?: (
    result: unknown,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => DataT;
  /** Estimates parser work without consuming the input. Scores range from 0 (trivial) to 1 (expensive). */
  getWorkerEstimate?: (
    data: DataType,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => number | undefined;
  // end Worker

  /** Human readable name */
  name: string;
  /** id should be the same as the field used in LoaderOptions */
  id: string;
  /** module is used to generate worker threads, need to be the module directory name */
  module: string;
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
export type LoaderWithParser<
  DataT = any,
  BatchT = any,
  LoaderOptionsT = StrictLoaderOptions
> = Loader<DataT, BatchT, LoaderOptionsT> & {
  /** Parse asynchronously and atomically from an arraybuffer */
  parse: (
    arrayBuffer: ArrayBuffer,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => Promise<DataT>;
  /** Parse asynchronously and atomically from a browser Blob without first copying to an ArrayBuffer. */
  parseBlob?: (blob: Blob, options?: LoaderOptionsT, context?: LoaderContext) => Promise<DataT>;
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
    iterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => AsyncIterable<BatchT>;
  /** Serializes one parser batch before returning it from a worker. */
  serializeWorkerBatch?: (
    batch: BatchT,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => unknown;
  /** Deserializes one parser batch returned from a worker. */
  deserializeWorkerBatch?: (
    batch: unknown,
    options?: LoaderOptionsT,
    context?: LoaderContext
  ) => BatchT;
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
  /** Cancels nested asynchronous operations where supported. */
  signal?: AbortSignal;
  /** Reports progress within a loader-defined phase. */
  reportProgress?: (progress: WorkerProgress) => void;
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
  /** Provides access to the core parsing and loading API without importing `@loaders.gl/core`. */
  coreApi: CoreAPI;

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

/**
 * Optionally resolves a loader to a parser-bearing implementation before parsing begins.
 * Can be used to avoid a later delay and may return a loader that supports `parseSync`.
 */
type Preload = (url: string, options?: PreloadOptions) => any;

/** Extracts the declared parser options, including from metadata-only loaders. */
export type LoaderOptionsType<T = Loader> = T extends {preload: (...args: any[]) => infer Parser}
  ? LoaderOptionsType<Awaited<Parser>>
  : T extends {parse: (data: any, options?: infer Options, ...args: any[]) => any}
    ? NonNullable<Options> extends LoaderOptions
      ? NonNullable<Options>
      : LoaderOptions
    : T extends Loader<unknown, unknown, infer Options>
      ? Options
      : never;

/** Extracts shapes from the loader's declared option namespaces. */
export type LoaderShapeType<T extends Loader = Loader> = T extends unknown
  ? {
      [Key in Exclude<keyof T['options'], 'core'>]: NonNullable<LoaderOptionsType<T>[Key]> extends {
        shape?: infer Shape;
      }
        ? Extract<Shape, string>
        : never;
    }[Exclude<keyof T['options'], 'core'>]
  : never;
type LoaderShapeOrString<Shape extends string> = [Shape] extends [never] ? string : Shape;
export type LoaderOptionsWithShape<
  Options extends LoaderOptions,
  Shape extends string
> = Options extends LoaderOptions ? Options & {core?: {shape?: LoaderShapeOrString<Shape>}} : never;
/** Checks declared options while allowing an options variable with a dynamic common shape. */
export type LoaderCallOptions<T extends Loader, Options extends LoaderOptions> = Options &
  (T extends {defaultShape: 'arrow'}
    ? LoaderOptionsType<T> &
        (Options extends {core: {shape: infer Shape}}
          ? string extends Shape
            ? LoaderOptions
            : LoaderOptionsWithShape<LoaderOptions, LoaderShapeType<T>>
          : LoaderOptions)
    : LoaderOptions);

/** Extracts possible shape selections, including optional option namespaces. */
type OptionShape<Options> = Options extends {shape?: infer Shape} ? Extract<Shape, string> : never;

/** Extracts required shape selections without treating omitted options as native output. */
type RequiredOptionShape<Options> = [Options] extends [{shape: infer Shape}]
  ? Extract<Shape, string>
  : never;

/** Extracts loader-scoped selection from the declared option namespaces. */
type ScopedOutputShape<T, Options, Required extends boolean = false> = T extends {
  options: infer Defaults;
}
  ? {
      [Key in Exclude<keyof Defaults, 'core'> & keyof Options]: Required extends true
        ? RequiredOptionShape<Options[Key]>
        : OptionShape<Options[Key]>;
    }[Exclude<keyof Defaults, 'core'> & keyof Options]
  : never;

/** Resolves an explicit loader-scoped selection before the common shape default. */
type RequiredOutputShape<T, Options> = [ScopedOutputShape<T, Options, true>] extends [never]
  ? [ScopedOutputShape<T, Options>] extends [never]
    ? Options extends {core: infer Core}
      ? RequiredOptionShape<Core>
      : never
    : never
  : ScopedOutputShape<T, Options, true>;

/** Evaluates each options variant independently, including an absent options object. */
type NativeArrowOutput<T, Options, Wrapped, Native> = [Options] extends [never]
  ? NativeArrowOutputForOption<T, undefined, Wrapped, Native>
  : Options extends unknown
    ? NativeArrowOutputForOption<T, Options, Wrapped, Native>
    : never;

/** Selects native output when certain and a union when shape selection is dynamic. */
type NativeArrowOutputForOption<T, Options, Wrapped, Native> = T extends {createDataSource: unknown}
  ? Wrapped
  : [Extract<Wrapped, {shape: 'arrow-table'}>] extends [never]
    ? Wrapped
    : [RequiredOutputShape<T, Options>] extends [never]
      ? [
          | ScopedOutputShape<T, Options>
          | (Options extends {core?: infer Core} ? OptionShape<Core> : never)
        ] extends [never]
        ? T extends {defaultShape: 'arrow'}
          ? Native
          : Wrapped
        : T extends {defaultShape: 'arrow'}
          ? Native | Wrapped
          : 'arrow' extends
                | ScopedOutputShape<T, Options>
                | (Options extends {core?: infer Core} ? OptionShape<Core> : never)
            ? Native | Wrapped
            : Wrapped
      : 'arrow' extends RequiredOutputShape<T, Options>
        ? Exclude<RequiredOutputShape<T, Options>, 'arrow'> extends never
          ? Native
          : Native | Wrapped
        : Wrapped;

/** Typescript helper to extract the public data type, accounting for native Arrow output. */
export type LoaderReturnType<T = Loader, Options = never> =
  T extends Loader<infer Return, unknown, unknown>
    ? NativeArrowOutput<T, Options, Return, arrow.Table>
    : never;
/** Typescript helper to extract the public batch type, accounting for native Arrow output. */
export type LoaderBatchType<T = Loader, Options = never> =
  T extends Loader<unknown, infer Batch, unknown>
    ? NativeArrowOutput<T, Options, Batch, arrow.RecordBatch>
    : never;

/** Typescript helper to extract options type from an array of loader types */
export type LoaderArrayOptionsType<LoadersT extends Loader[] = Loader[]> = LoaderOptionsWithShape<
  LoaderOptionsType<LoadersT[number]>,
  LoaderShapeType<LoadersT[number]>
>;
/** Typescript helper to extract data type from an array of loader types. */
export type LoaderArrayReturnType<
  LoadersT extends Loader[] = Loader[],
  Options = never
> = LoaderReturnType<LoadersT[number], Options>;
/** Typescript helper to extract batch type from an array of loader types. */
export type LoaderArrayBatchType<
  LoadersT extends Loader[] = Loader[],
  Options = never
> = LoaderBatchType<LoadersT[number], Options>;

/**
 * Parses `data` asynchronously using the supplied loader, parse function provided via the loader context
 */
export async function parseFromContext<
  LoaderT extends Loader,
  const OptionsT extends StrictLoaderOptions | undefined = LoaderOptionsWithShape<
    LoaderOptionsType<LoaderT>,
    LoaderShapeType<LoaderT>
  >
>(
  data: ArrayBuffer,
  loader: LoaderT,
  options: OptionsT,
  context: LoaderContext
): Promise<LoaderReturnType<LoaderT, OptionsT>>;

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
  const OptionsT extends StrictLoaderOptions | undefined = LoaderOptionsType<LoaderT>
>(
  data: ArrayBuffer,
  loader: LoaderT,
  options: OptionsT,
  context: LoaderContext
): LoaderReturnType<LoaderT, OptionsT> {
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
  const OptionsT extends StrictLoaderOptions | undefined = LoaderOptionsType<LoaderT>
>(
  data: Iterable<ArrayBuffer> | AsyncIterable<ArrayBuffer> | Response,
  loader: LoaderT,
  options: OptionsT,
  context: LoaderContext
): Promise<AsyncIterable<LoaderBatchType<LoaderT, OptionsT>>> {
  if (!context._parseInBatches) {
    throw new Error('parseInBatches');
  }
  return context._parseInBatches(data, loader, options, context);
}
