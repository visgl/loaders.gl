import {isFileReadable} from '../javascript-utils/is-type';
import {fetchFile} from './fetch/fetch-file';
import {isLoaderObject} from './loader-utils/normalize-loader';
import {mergeLoaderAndUserOptions} from './loader-utils/normalize-options';
import {autoDetectLoader} from './loader-utils/auto-detect-loader';

import {parse, parseInBatches} from './parse';
import {getRegisteredLoaders} from './register-loaders';

export async function loadInBatches(url, loaders, options) {
  const response = await fetchFile(url, options);
  return parseInBatches(response, loaders, options, url);
}

// Note: Load does duplicate a lot of parse.
// Works like parse but can call `loadAndParse` for parsers that need to do their own loading
// it can also call fetchFile on string urls, which `parse` won't do.
export async function load(url, loaders, options) {
  // Signature: load(url, options)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    options = loaders;
    loaders = null;
  }

  // Extract a url for auto detection
  const autoUrl = isFileReadable(url) ? url.name : url;

  loaders = loaders || getRegisteredLoaders();
  const loader = Array.isArray(loaders) ? autoDetectLoader(autoUrl, null, loaders) : loaders;

  options = mergeLoaderAndUserOptions(options, loader);

  // Some loaders can not separate reading and parsing of data (e.g ImageLoader)
  if (loader && loader.loadAndParse) {
    return await loader.loadAndParse(url, options);
  }

  // at this point, data can be binary or text
  let data = url;
  if (isFileReadable(data) || typeof data === 'string') {
    data = await fetchFile(url, options);
  }
  return parse(data, loaders, options, autoUrl);
}
