import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeLoaderAndUserOptions} from './loader-utils/normalize-options';
import {getIteratorFromData} from './loader-utils/get-data';
import {selectLoader} from './select-loader';

export async function parseInBatchesSync(data, loaders, options, url) {
  // Signature: parseInBatchesSync(data, options, url)
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
    // parseInBatchesSync
  };

  return parseWithLoaderInBatchesSync(data, loader, options, context);
}

function parseWithLoaderInBatchesSync(data, loader, options, context) {
  // Create async iterator adapter for data, and concatenate result
  if (loader.parseInBatchesSync) {
    const inputIterator = getIteratorFromData(data);
    const outputIterator = loader.parseInBatchesSync(inputIterator, options, context, loader);
    return outputIterator;
  }

  return assert(false);
}
