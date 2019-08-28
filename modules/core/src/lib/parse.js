import {selectLoader} from './select-loader';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeLoaderAndUserOptions} from './loader-utils/normalize-options';
import {getUrlFromData} from './loader-utils/get-data';
import {parseWithLoader, parseWithLoaderInBatches, parseWithLoaderSync} from './parse-with-loader';

export async function parse(data, loaders, options, url) {
  // Signature: parse(data, options, url)
  // Uses registered loaders
  if (loaders && !Array.isArray(loaders) && !isLoaderObject(loaders)) {
    url = options;
    options = loaders;
    loaders = null;
  }

  options = options || {};

  // Extract a url for auto detection
  const autoUrl = getUrlFromData(data, url);

  // Chooses a loader and normalize it
  const loader = selectLoader(loaders, autoUrl, data);

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  return await parseWithLoader(data, loader, options, autoUrl);
}

export function parseSync(data, loaders, options, url) {
  // Signature: parseSync(data, options, url)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    url = options;
    options = loaders;
    loaders = null;
  }

  // Chooses a loader and normalize it
  const loader = selectLoader(loaders, url, data);
  // Note: if nothrow option was set, it is possible that no loader was found, if so just return null
  if (!loader) {
    return null;
  }

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  return parseWithLoaderSync(data, loader, options, url);
}

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

  return parseWithLoaderInBatches(data, loader, options, url);
}

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

  return parseWithLoaderInBatches(data, loader, options, url);
}
