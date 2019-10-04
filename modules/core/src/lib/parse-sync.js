import {selectLoader} from './select-loader';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeOptions} from './loader-utils/merge-options';
import {getArrayBufferOrStringFromDataSync} from './loader-utils/get-data';
import {getLoaders, getLoaderContext} from './loader-utils/get-loader-context';

export function parseSync(data, loaders, options, context) {
  // Signature: parseSync(data, options, url)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
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

  // Chooses a loader (and normalizes it)
  // Also use any loaders in the context, new loaders take priority
  const candidateLoaders = getLoaders(loaders, context);
  const loader = selectLoader(candidateLoaders, url, data);
  // Note: if nothrow option was set, it is possible that no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  options = mergeOptions(loader, options, url);

  context = getLoaderContext({url, parseSync, loaders}, options);

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
    `${
      loader.name
    } loader: 'parseSync' not supported by this loader, use 'parse' instead. ${context.url || ''}`
  );
}
