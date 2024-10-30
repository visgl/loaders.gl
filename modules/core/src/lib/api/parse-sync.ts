// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Loader,
  LoaderWithParser,
  LoaderOptions,
  LoaderContext,
  SyncDataType,
  LoaderOptionsType,
  LoaderReturnType,
  LoaderArrayOptionsType,
  LoaderArrayReturnType
} from '@loaders.gl/loader-utils';
import {selectLoaderSync} from './select-loader';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getArrayBufferOrStringFromDataSync} from '../loader-utils/get-data';
import {getLoaderContext, getLoadersFromContext} from '../loader-utils/loader-context';
import {getResourceUrl} from '../utils/resource-utils';

// OVERLOADS

/**
 * Parses `data` synchronously using the specified loader
 */
export function parseSync<
  LoaderT extends Loader,
  OptionsT extends LoaderOptions = LoaderOptionsType<LoaderT>
>(
  data: SyncDataType,
  loader: LoaderT,
  options?: OptionsT,
  context?: LoaderContext
): LoaderReturnType<LoaderT>;

/**
 * Parses `data` synchronously by matching one of the supplied loaders
 */
export function parseSync<
  LoaderArrayT extends Loader[],
  OptionsT extends LoaderOptions = LoaderArrayOptionsType<LoaderArrayT>
>(
  data: SyncDataType,
  loaders: LoaderArrayT,
  options?: OptionsT,
  context?: LoaderContext
): LoaderArrayReturnType<LoaderArrayT>;

/**
 * Parses `data` synchronously by matching a pre=registered loader
 * @deprecated Loader registration is deprecated, use parseSync(data, loaders, options) instead
 */
export function parseSync(data: SyncDataType, options?: LoaderOptions): unknown;

/**
 * Parses `data` synchronously using a specified loader
 */
export function parseSync(
  data: SyncDataType,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): unknown {
  // Signature: parseSync(data, options)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined; // context not supported in short signature
    options = loaders as LoaderOptions;
    loaders = undefined;
  }

  options = options || {};

  // Chooses a loader (and normalizes it)
  // Also use any loaders in the context, new loaders take priority
  const typedLoaders = loaders as Loader | Loader[] | undefined;
  const candidateLoaders = getLoadersFromContext(typedLoaders, context);
  const loader = selectLoaderSync(data, candidateLoaders, options);
  // Note: if nothrow option was set, it is possible that no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  options = normalizeOptions(options, loader, candidateLoaders as Loader[] | undefined);

  // Extract a url for auto detection
  const url = getResourceUrl(data);

  const parse = () => {
    throw new Error('parseSync called parse (which is async');
  };
  context = getLoaderContext(
    {url, _parseSync: parse, _parse: parse, loaders: loaders as Loader[]},
    options,
    context || null
  );

  return parseWithLoaderSync(loader as LoaderWithParser, data, options, context);
}

// TODO - should accept loader.parseSync/parse and generate 1 chunk asyncIterator
function parseWithLoaderSync(
  loader: LoaderWithParser,
  data: SyncDataType,
  options: LoaderOptions,
  context: LoaderContext
) {
  data = getArrayBufferOrStringFromDataSync(data, loader, options);

  if (loader.parseTextSync && typeof data === 'string') {
    return loader.parseTextSync(data, options); // , context, loader);
  }

  if (loader.parseSync && data instanceof ArrayBuffer) {
    return loader.parseSync(data, options, context); // , loader);
  }

  // TBD - If synchronous parser not available, return null
  throw new Error(
    `${loader.name} loader: 'parseSync' not supported by this loader, use 'parse' instead. ${
      context.url || ''
    }`
  );
}
