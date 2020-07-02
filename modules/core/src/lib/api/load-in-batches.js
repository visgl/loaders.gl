import {isLoaderObject} from '../loader-utils/normalize-loader';
import {getFetchFunction} from '../loader-utils/option-utils';

import {parseInBatches} from './parse-in-batches';

// Note returns promise or list of promises
export function loadInBatches(file, loaders, options) {
  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    options = loaders;
    loaders = null;
  }

  // Select fetch function
  const fetch = getFetchFunction(options || {});

  return loadOneFileInBatches(file, loaders, options, fetch);
}

async function loadOneFileInBatches(file, loaders, options, fetch) {
  if (typeof file === 'string') {
    const url = file;
    const response = await fetch(url);
    return parseInBatches(response, loaders, options, url);
  }
  return parseInBatches(file, loaders, options);
}
