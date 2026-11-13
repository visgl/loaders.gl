// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getNativeArrowOptions, normalizeNativeArrowResult} from '../loader-utils/native-arrow';

import {resolveLoaderAuthenticationOptions} from '@loaders.gl/core/loader-utils';
import type {
  LoaderArrayOptionsType,
  LoaderShapeType,
  LoaderOptionsType,
  LoaderOptionsWithShape,
  LoaderCallOptions,
  Loader,
  LoaderContext,
  LoaderOptions,
  DataType,
  LoaderWithParser,
  LoaderReturnType,
  LoaderArrayReturnType,
  StrictLoaderOptions
} from '@loaders.gl/core/loader-utils';
import {
  parseWithWorker,
  shouldParseWithWorker,
  mergeOptions,
  isResponse,
  isBlob
} from '@loaders.gl/core/loader-utils';
import {validateWorkerVersion} from '@loaders.gl/core/worker-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getArrayBufferOrStringFromData} from '../loader-utils/get-data';
import {getArrayBufferFromData} from '../loader-utils/get-data';
import {getLoaderContext, getLoadersFromContext} from '../loader-utils/loader-context';
import {getResourceUrl} from '../utils/resource-utils';
import {getLoaderImplementation, isLoaderWithParser} from './load-loader';
import {selectLoader} from './select-loader';

// type LoaderArrayType<T> = T extends (infer Loader)[] ? LoaderOptionsType<Loader> : T

/**
 * Parses `data` asynchronously using the supplied loader
 */
export async function parse<LoaderT extends Loader>(
  data: DataType | Promise<DataType>,
  loader: LoaderT,
  options?: undefined,
  context?: LoaderContext
): Promise<LoaderReturnType<LoaderT>>;

export async function parse<
  LoaderT extends Loader,
  const OptionsT extends LoaderOptions = LoaderOptionsWithShape<
    LoaderOptionsType<LoaderT>,
    LoaderShapeType<LoaderT>
  >
>(
  data: DataType | Promise<DataType>,
  loader: LoaderT,
  options?: OptionsT & LoaderCallOptions<NoInfer<LoaderT>, NoInfer<OptionsT>>,
  context?: LoaderContext
): Promise<LoaderReturnType<LoaderT, OptionsT>>;

/**
 * Parses `data` asynchronously by matching one of the supplied loader
 */
export async function parse<LoaderArrayT extends Loader[]>(
  data: DataType | Promise<DataType>,
  loaders: LoaderArrayT,
  options?: undefined,
  context?: LoaderContext
): Promise<LoaderArrayReturnType<LoaderArrayT>>;

export async function parse<
  LoaderArrayT extends Loader[],
  const OptionsT extends LoaderOptions = LoaderArrayOptionsType<LoaderArrayT>
>(
  data: DataType | Promise<DataType>,
  loaders: LoaderArrayT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<LoaderArrayReturnType<LoaderArrayT, OptionsT>>;

/**
 * Parses data asynchronously by matching a pre-registered loader
 * @deprecated Loader registration is deprecated, use parse(data, loaders, options) instead
 */
export async function parse(
  data: DataType | Promise<DataType>,
  options?: LoaderOptions
): Promise<unknown>;

/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
// implementation signature
export async function parse(
  data: DataType | Promise<DataType>,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<unknown> {
  // Signature: parse(data, options, context | url)
  // Uses registered loaders
  if (loaders && !Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined; // context not supported in short signature
    options = loaders as LoaderOptions;
    loaders = undefined;
  }

  (options?.signal || context?.signal)?.throwIfAborted();
  data = await data; // Resolve any promise
  options = options || ({} as LoaderOptions);
  (options.signal || context?.signal)?.throwIfAborted(); // Could be invalid...

  // Extract a url for auto detection
  const url = getResourceUrl(data);

  // Chooses a loader (and normalizes it)
  // Also use any loaders in the context, new loaders take priority
  const typedLoaders = loaders as Loader | Loader[] | undefined;
  const candidateLoaders = getLoadersFromContext(typedLoaders, context);
  // todo hacky type cast
  const loader = await selectLoader(data as ArrayBuffer, candidateLoaders, options);
  // Note: if no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  // @ts-expect-error candidateLoaders
  const normalizedOptions = normalizeOptions(options, loader, candidateLoaders, url); // Could be invalid...
  const authenticationLoader =
    !loader.getAuthentications && normalizedOptions.core?.credentials?.length
      ? await getLoaderImplementation(loader, normalizedOptions, url || context?.url)
      : loader;
  const strictOptions = await resolveLoaderAuthenticationOptions(
    authenticationLoader,
    url || '',
    normalizedOptions
  );

  // Get a context (if already present, will be unchanged)
  const nativeArrowOptions = getNativeArrowOptions(loader, strictOptions, false);
  context = getLoaderContext(
    // @ts-expect-error
    {url, _parse: parse, loaders: candidateLoaders},
    nativeArrowOptions || strictOptions,
    context || null
  );

  const result = await parseWithLoader(loader, data, nativeArrowOptions || strictOptions, context);
  return nativeArrowOptions ? normalizeNativeArrowResult(result, loader) : result;
}

// TODO - should accept loader.parseAsyncIterator and concatenate.
async function parseWithLoader(
  loader: Loader,
  data,
  options: StrictLoaderOptions,
  context: LoaderContext
): Promise<unknown> {
  (options.signal || context.signal)?.throwIfAborted();
  validateWorkerVersion(loader);

  options = mergeOptions(loader.options, options);

  if (isResponse(data)) {
    // Serialize to support passing the response to web worker
    const {ok, redirected, status, statusText, type, url} = data;
    const headers = Object.fromEntries(data.headers.entries());
    // @ts-expect-error TODO - fix this
    context.response = {headers, ok, redirected, status, statusText, type, url};
  }

  const loaderWithParser = await getLoaderImplementation(loader, options, context.url);

  if (loaderWithParser.createDataSourceSync && !isLoaderWithParser(loaderWithParser)) {
    throw new Error(`${loader.id} creates sources. Use createDataSource() to open a source.`);
  }

  const output = loaderWithParser.prepareParseOutput?.(options);
  const parseOptions = output?.options ?? options;
  let result: unknown;

  if (shouldParseWithWorker(loaderWithParser, data, parseOptions, context, loader)) {
    data = await getArrayBufferFromData(data, parseOptions);
    result = await parseWithWorker(loaderWithParser, data, parseOptions, context, parse);
  } else if (isBlob(data) && loaderWithParser.parseBlob) {
    result = await loaderWithParser.parseBlob(data, parseOptions, context);
  } else {
    data = await getArrayBufferOrStringFromData(data, loader, parseOptions);
    result = await parseWithLoaderImplementation(loaderWithParser, data, parseOptions, context);
  }
  return output ? output.convert(result) : result;
}

async function parseWithLoaderImplementation(
  loader: LoaderWithParser,
  data: string | ArrayBuffer,
  options: StrictLoaderOptions,
  context: LoaderContext
): Promise<unknown> {
  if (loader.parseText && typeof data === 'string') {
    return await loader.parseText(data, options, context);
  }

  // Fall back to synchronous text parser, wrap results in promises
  if (loader.parseTextSync && typeof data === 'string') {
    return loader.parseTextSync(data, options, context);
  }

  if (loader.parse) {
    return await loader.parse(data as ArrayBuffer, options, context);
  }

  if (loader.parseSync) {
    throw new Error(
      `${loader.name} loader: 'parse' not available on parser-bearing sync loader. Add an async 'parse' function to this loader, or call preload(loader) before parseSync(). ${context.url || ''}`
    );
  }

  if (loader.createDataSourceSync) {
    throw new Error(`${loader.id} creates sources. Use createDataSource() to open a source.`);
  }

  // TBD - If asynchronous parser not available, return null
  throw new Error(`${loader.id} loader - no parser found and worker is disabled`);
}
