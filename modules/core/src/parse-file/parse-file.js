import {autoDetectLoader} from './auto-detect-loader';
import {normalizeLoader, isLoaderObject} from './normalize-loader';
import {parseWithLoader, parseWithLoaderInBatches, parseWithLoaderSync} from './parse-with-loader';
import NullLog from '../log-utils/null-log';

export async function parseFile(data, loaders, options, url) {
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  normalizeLoader(loader);

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  return await parseWithLoader(data, loader, options, url);
}

export function parseFileSync(data, loaders, options, url) {
  // Choose loader and normalize it
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, data, loaders) : loaders;
  normalizeLoader(loader);

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  return parseWithLoaderSync(data, loader, options, url);
}

export async function parseFileInBatches(data, loaders, options, url) {
  // Choose loader and normalize it
  const loader = Array.isArray(loaders) ? autoDetectLoader(url, null, loaders) : loaders;
  normalizeLoader(loader);

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  return parseWithLoaderInBatches(data, loader, options, url);
}

export async function parseFileInBatchesSync(data, loaders, options, url) {
  // Choose loader and normalize it
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
