import {selectLoader} from './select-loader';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeLoaderAndUserOptions} from './loader-utils/normalize-options';
import {getUrlFromData} from './loader-utils/get-data';
import {
  parseWithLoader,
  parseWithLoaderInBatches,
  parseWithLoaderSync
} from './loader-utils/parse-with-loader';

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

  const context = {
    url: autoUrl,
    parse
  };

  return await parseWithLoader(data, loader, options, context);
}
