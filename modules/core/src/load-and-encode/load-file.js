import {fetchFile, readFileSync} from '../fetch-and-write/fetch-file';
import {isLoaderObject} from '../loader-encoder-utils/normalize-loader';
import {autoDetectLoader} from '../loader-encoder-utils/auto-detect-loader';

import {parseFile, parseFileSync, parseFileInBatches} from './parse-file';
import {getRegisteredLoaders} from './register-loaders';

export async function loadFileInBatches(url, loaders, options) {
  const response = await fetchFile(url, options);
  return parseFileInBatches(response, loaders, options, url);
}

export async function loadFile(url, loaders, options) {
  // Signature: loadFile(url, options)
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
  return parseFile(response, loaders, options, url);
}

export function loadFileSync(url, loaders, options) {
  const data = readFileSync(url, options);
  const result = parseFileSync(data, loaders, options, url);
  // Separate return to facilitate breakpoint setting
  return result;
}
