import {selectLoader} from './select-loader';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeLoaderAndUserOptions} from './loader-utils/normalize-options';
import {parseWithLoaderSync} from './loader-utils/parse-with-loader';

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

  const context = {
    url,
    parseSync
  };

  return parseWithLoaderSync(data, loader, options, context);
}
