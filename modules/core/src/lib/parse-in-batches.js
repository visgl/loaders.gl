import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeLoaderAndUserOptions} from './loader-utils/normalize-options';
import {getAsyncIteratorFromData} from './loader-utils/get-data';
import {selectLoader} from './select-loader';

export async function parseInBatches(data, loaders, options, url) {
  // Signature: parseInBatches(data, options, url)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    url = options;
    options = loaders;
    loaders = null;
  }

  // Chooses a loader and normalizes it
  // TODO - only uses URL, need a selectLoader variant that peeks at first stream chunk...
  const loader = selectLoader(loaders, url, null);

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  const context = {
    url
    // parseWithLoaderInBatches
  };

  return parseWithLoaderInBatches(loader, data, options, context);
}

function parseWithLoaderInBatches(loader, data, options, context) {
  // Create async iterator adapter for data, and concatenate result
  if (loader.parseInBatches) {
    const inputIterator = getAsyncIteratorFromData(data);
    const outputIterator = loader.parseInBatches(inputIterator, options, context, loader);
    return outputIterator;
  }

  // TODO - update after test cases have been fixed
  return null;
}
