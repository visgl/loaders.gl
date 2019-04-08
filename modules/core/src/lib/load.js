import {fetchFile} from './fetch/fetch-file';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {autoDetectLoader} from './loader-utils/auto-detect-loader';

import {parse, parseInBatches} from './parse';
import {getRegisteredLoaders} from './register-loaders';

export async function loadInBatches(url, loaders, options) {
  const response = await fetchFile(url, options);
  return parseInBatches(response, loaders, options, url);
}

export async function load(url, loaders, options) {
  // Signature: load(url, options)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    options = loaders;
    loaders = null;
  }

  loaders = loaders || getRegisteredLoaders();
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, null, loaders) : loaders;

  // Some loaders can not separate reading and parsing of data (e.g ImageLoader)
  if (loader && loader.loadAndParse) {
    return await loader.loadAndParse(url, options);
  }

  // at this point, data can be binary or text
  const response = await fetchFile(url, options);
  return parse(response, loaders, options, url);
}
