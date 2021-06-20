import type {SyncDataType, Loader, LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';
import {assert} from '@loaders.gl/loader-utils';
import {selectLoaderSync} from './select-loader';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getArrayBufferOrStringFromDataSync} from '../loader-utils/get-data';
import {getLoaders, getLoaderContext} from '../loader-utils/context-utils';
import {getResourceUrlAndType} from '../utils/resource-utils';

/**
 * Parses `data` synchronously using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function parseSync(
  data: SyncDataType,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): any {
  assert(!context || typeof context === 'object'); // parseSync no longer accepts final url

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
  const candidateLoaders = getLoaders(loaders, context);
  const loader = selectLoaderSync(data, candidateLoaders, options);
  // Note: if nothrow option was set, it is possible that no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  options = normalizeOptions(options, loader, candidateLoaders);

  // Extract a url for auto detection
  const {url} = getResourceUrlAndType(data);

  context = getLoaderContext({url, parseSync, loaders: loaders as Loader[]}, options);

  return parseWithLoaderSync(loader, data, options, context);
}

// TODO - should accept loader.parseSync/parse and generate 1 chunk asyncIterator
function parseWithLoaderSync(loader, data, options, context) {
  data = getArrayBufferOrStringFromDataSync(data, loader);

  if (loader.parseTextSync && typeof data === 'string') {
    return loader.parseTextSync(data, options, context, loader);
  }

  if (loader.parseSync) {
    return loader.parseSync(data, options, context, loader);
  }

  // TBD - If synchronous parser not available, return null
  throw new Error(
    `${loader.name} loader: 'parseSync' not supported by this loader, use 'parse' instead. ${
      context.url || ''
    }`
  );
}
