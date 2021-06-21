import type {DataType, Loader, LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';
import {assert, validateWorkerVersion} from '@loaders.gl/worker-utils';
import {parseWithWorker, canParseWithWorker} from '@loaders.gl/loader-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {normalizeOptions} from '../loader-utils/option-utils';
import {getArrayBufferOrStringFromData} from '../loader-utils/get-data';
import {getLoaders, getLoaderContext} from '../loader-utils/context-utils';
import {getResourceUrlAndType} from '../utils/resource-utils';
import {selectLoader} from './select-loader';

/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export async function parse(
  data: DataType | Promise<DataType>,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<any> {
  assert(!context || typeof context === 'object'); // parse no longer accepts final url

  // Signature: parse(data, options, context | url)
  // Uses registered loaders
  if (loaders && !Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined; // context not supported in short signature
    options = loaders as LoaderOptions;
    loaders = undefined;
  }

  data = await data; // Resolve any promise
  options = options || {};

  // Extract a url for auto detection
  const {url} = getResourceUrlAndType(data);

  // Chooses a loader (and normalizes it)
  // Also use any loaders in the context, new loaders take priority
  const candidateLoaders = getLoaders(loaders, context);
  // todo hacky type cast
  const loader = await selectLoader(data as ArrayBuffer, candidateLoaders, options);
  // Note: if nothrow option was set, it is possible that no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  options = normalizeOptions(options, loader, candidateLoaders, url);

  // Get a context (if already present, will be unchanged)
  context = getLoaderContext({url, parse, loaders: candidateLoaders}, options, context);

  return await parseWithLoader(loader, data, options, context);
}

// TODO: support progress and abort
// TODO - should accept loader.parseAsyncIterator and concatenate.
async function parseWithLoader(loader, data, options, context) {
  validateWorkerVersion(loader);

  data = await getArrayBufferOrStringFromData(data, loader);

  // First check for synchronous text parser, wrap results in promises
  if (loader.parseTextSync && typeof data === 'string') {
    options.dataType = 'text';
    return loader.parseTextSync(data, options, context, loader);
  }

  // If we have a workerUrl and the loader can parse the given options efficiently in a worker
  if (canParseWithWorker(loader, data, options, context)) {
    return await parseWithWorker(loader, data, options, context, parse);
  }

  // Check for asynchronous parser
  if (loader.parseText && typeof data === 'string') {
    return await loader.parseText(data, options, context, loader);
  }

  if (loader.parse) {
    return await loader.parse(data, options, context, loader);
  }

  // This should not happen, all sync loaders should also offer `parse` function
  assert(!loader.parseSync);

  // TBD - If asynchronous parser not available, return null
  return assert(false);
}
