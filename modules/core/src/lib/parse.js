import {assert, validateLoaderVersion} from '@loaders.gl/loader-utils';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeOptions} from './loader-utils/merge-options';
import {getUrlFromData} from './loader-utils/get-data';
import {getArrayBufferOrStringFromData} from './loader-utils/get-data';
import {getLoaders, getLoaderContext} from './loader-utils/get-loader-context';
import parseWithWorker, {canParseWithWorker} from './loader-utils/parse-with-worker';
import {selectLoader} from './select-loader';

export async function parse(data, loaders, options, context) {
  // Signature: parse(data, options, context | url)
  // Uses registered loaders
  if (loaders && !Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = options;
    options = loaders;
    loaders = null;
  }

  // DEPRECATED - backwards compatibility, last param can be URL...
  let url = '';
  if (typeof context === 'string') {
    url = context;
    context = null;
  }

  options = options || {};

  // Extract a url for auto detection
  const autoUrl = getUrlFromData(data, url);

  // Chooses a loader (and normalizes it)
  // Also use any loaders in the context, new loaders take priority
  const candidateLoaders = getLoaders(loaders, context);
  const loader = selectLoader(candidateLoaders, autoUrl, data);
  // Note: if nothrow option was set, it is possible that no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  options = mergeOptions(loader, options, autoUrl);

  // Get a context (if already present, will be unchanged)
  context = getLoaderContext({url: autoUrl, parse, loaders: candidateLoaders}, options, context);

  return await parseWithLoader(loader, data, options, context);
}

// TODO: support progress and abort
// TODO - should accept loader.parseAsyncIterator and concatenate.
async function parseWithLoader(loader, data, options, context) {
  validateLoaderVersion(loader);

  data = await getArrayBufferOrStringFromData(data, loader);

  // First check for synchronous text parser, wrap results in promises
  if (loader.parseTextSync && typeof data === 'string') {
    options.dataType = 'text';
    return loader.parseTextSync(data, options, context, loader);
  }

  // If we have a workerUrl and the loader can parse the given options efficiently in a worker
  if (canParseWithWorker(loader, data, options, context)) {
    return await parseWithWorker(loader, data, options, context);
  }

  // Check for asynchronous parser
  if (loader.parse) {
    return await loader.parse(data, options, context, loader);
  }

  // This should not happen, all sync loaders should also offer `parse` function
  assert(!loader.parseSync);

  // TBD - If asynchronous parser not available, return null
  return assert(false);
}
