import {autoDetectLoader} from '../loader-encoder-utils/auto-detect-loader';
import {normalizeLoader, isLoaderObject} from '../loader-encoder-utils/normalize-loader';
import NullLog from '../loader-encoder-utils/null-log';
import {getRegisteredLoaders} from './register-loaders';
import {parseWithLoader, parseWithLoaderInBatches, parseWithLoaderSync} from './parse-with-loader';

export async function parseFile(data, loaders, options, url) {
  // Signature: parseFile(data, options, url)
  // Uses registered loaders
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    url = options;
    options = loaders;
    loaders = null;
  }

  loaders = loaders || getRegisteredLoaders();
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  if (!loader) {
    // no loader available
    return null;
  }

  normalizeLoader(loader);

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  return await parseWithLoader(data, loader, options, url);
}

export function parseFileSync(data, loaders, options, url) {
  // Signature: parseFileSync(data, options, url)
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

export async function parseFileInBatches(data, loaders, options, url) {
  // Signature: parseFileInBatches(data, options, url)
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

export async function parseFileInBatchesSync(data, loaders, options, url) {
  // Signature: parseFileInBatchesSync(data, options, url)
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

function mergeLoaderAndUserOptions(options, loader) {
  // TODO - explain why this optionb is needed for parsing
  options = Object.assign({}, loader.DEFAULT_OPTIONS, loader.options, options, {
    dataType: 'arraybuffer'
  });

  // LOGGING

  // options.log can be set to `null` to defeat logging
  if (options.log === null) {
    options.log = new NullLog();
  }
  // log defaults to console
  if (!('log' in options)) {
    /* global console */
    options.log = console;
  }

  return options;
}
