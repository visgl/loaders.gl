import {isLoaderObject} from '../loader-utils/normalize-loader';
import {getFetchFunction} from '../loader-utils/option-utils';

import {parseInBatches} from './parse-in-batches';

// Note returns promise or list of promises
export function loadInBatches(files, loaders, options) {
  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    options = loaders;
    loaders = null;
  }

  // Select fetch function
  const fetch = getFetchFunction(options || {});

  // Single url/file
  if (!Array.isArray(files)) {
    return loadOneFileInBatches(files, loaders, options, fetch);
  }

  // Multiple URLs / files
  const promises = files.map((file) => loadOneFileInBatches(file, loaders, options, fetch));

  // No point in waiting here for all responses before starting to stream individual streams?
  return promises;
}

async function loadOneFileInBatches(file, loaders, options, fetch) {
  if (typeof file === 'string') {
    const url = file;
    const response = await fetch(url);
    return await parseInBatches(response, loaders, options);
  }
  return await parseInBatches(file, loaders, options);
}
