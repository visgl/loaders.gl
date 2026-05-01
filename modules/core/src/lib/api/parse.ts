// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Loader,
  LoaderContext,
  LoaderOptions,
  LoaderOptionsWithShape,
  DataType,
  LoaderWithParser,
  LoaderOptionsType,
  LoaderShapeType,
  LoaderReturnType,
  LoaderArrayOptionsType,
  LoaderArrayReturnType,
  StrictLoaderOptions
} from '@loaders.gl/loader-utils';
import {
  parseWithWorker,
  canParseWithWorker,
  mergeOptions,
  isResponse,
  isSourceLoader
} from '@loaders.gl/loader-utils';
import {assert, validateWorkerVersion} from '@loaders.gl/worker-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getArrayBufferOrStringFromData} from '../loader-utils/get-data';
import {getArrayBufferFromData} from '../loader-utils/get-data';
import {getLoaderContext, getLoadersFromContext} from '../loader-utils/loader-context';
import {getResourceUrl} from '../utils/resource-utils';
import {getLoaderImplementation} from './load-loader';
import {selectLoader} from './select-loader';

// type LoaderArrayType<T> = T extends (infer Loader)[] ? LoaderOptionsType<Loader> : T

/**
 * Parses `data` asynchronously using the supplied loader
 */
export async function parse<
  LoaderT extends Loader,
  OptionsT extends LoaderOptions = LoaderOptionsWithShape<
    LoaderOptionsType<LoaderT>,
    LoaderShapeType<LoaderT>
  >
>(
  data: DataType | Promise<DataType>,
  loader: LoaderT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<LoaderReturnType<LoaderT>>;

/**
 * Parses `data` asynchronously by matching one of the supplied loader
 */
export async function parse<
  LoaderArrayT extends Loader[],
  OptionsT extends LoaderOptions = LoaderArrayOptionsType<LoaderArrayT>
>(
  data: DataType | Promise<DataType>,
  loaders: LoaderArrayT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<LoaderArrayReturnType<LoaderArrayT>>;

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

  data = await data; // Resolve any promise
  options = options || ({} as LoaderOptions); // Could be invalid...

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

  if (isSourceLoader(loader)) {
    throw new Error(
      `${loader.id} is a SourceLoader. Use load() to create a runtime source object instead of parse().`
    );
  }

  // Normalize options
  // @ts-expect-error candidateLoaders
  const strictOptions = normalizeOptions(options, loader, candidateLoaders, url); // Could be invalid...

  // Get a context (if already present, will be unchanged)
  context = getLoaderContext(
    // @ts-expect-error
    {url, _parse: parse, loaders: candidateLoaders},
    strictOptions,
    context || null
  );

  return await parseWithLoader(loader, data, strictOptions, context);
}

// TODO: support progress and abort
// TODO - should accept loader.parseAsyncIterator and concatenate.
async function parseWithLoader(
  loader: Loader,
  data,
  options: StrictLoaderOptions,
  context: LoaderContext
): Promise<unknown> {
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

  if (canParseWithWorker(loaderWithParser, options)) {
    data = await getArrayBufferFromData(data, options);
    return await parseWithWorker(loaderWithParser, data, options, context, parse);
  }

  data = await getArrayBufferOrStringFromData(data, loader, options);

  return await parseWithLoaderImplementation(loaderWithParser, data, options, context);
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

  // This should not happen, all sync loaders should also offer `parse` function
  assert(!loader.parseSync);

  // TBD - If asynchronous parser not available, return null
  throw new Error(`${loader.id} loader - no parser found and worker is disabled`);
}
