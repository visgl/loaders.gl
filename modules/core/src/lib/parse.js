import {isFileReadable} from '../javascript-utils/is-type';
import {autoDetectLoader} from './loader-utils/auto-detect-loader';
import {normalizeLoader, isLoaderObject} from './loader-utils/normalize-loader';
import {mergeLoaderAndUserOptions} from './loader-utils/normalize-options';
import {getRegisteredLoaders} from './register-loaders';
import {parseWithLoader, parseWithLoaderInBatches, parseWithLoaderSync} from './parse-with-loader';

export async function parse(data, loaders, options, url) {
  // Signature: parse(data, options, url)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    url = options;
    options = loaders;
    loaders = null;
  }

  // Extract a url for auto detection
  const autoUrl = isFileReadable(url) ? url.name : url;

  loaders = loaders || getRegisteredLoaders();
  const loader = Array.isArray(loaders) ? autoDetectLoader(autoUrl, data, loaders) : loaders;
  if (!loader) {
    // no loader available
    // TODO: throw error?
    return null;
  }

  normalizeLoader(loader);

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

  // Choose loader and normalize it
  loaders = loaders || getRegisteredLoaders();
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  normalizeLoader(loader);

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

  // Choose loader and normalize it
  loaders = loaders || getRegisteredLoaders();
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, null, loaders) : loaders;
  normalizeLoader(loader);

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

  // Choose loader and normalize it
  loaders = loaders || getRegisteredLoaders();
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, null, loaders) : loaders;
  normalizeLoader(loader);

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  return parseWithLoaderInBatches(data, loader, options, url);
}
