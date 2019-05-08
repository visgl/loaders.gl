"use strict";module.export({parse:()=>parse,parseSync:()=>parseSync,parseInBatches:()=>parseInBatches,parseInBatchesSync:()=>parseInBatchesSync});var autoDetectLoader;module.link('./loader-utils/auto-detect-loader',{autoDetectLoader(v){autoDetectLoader=v}},0);var normalizeLoader,isLoaderObject;module.link('./loader-utils/normalize-loader',{normalizeLoader(v){normalizeLoader=v},isLoaderObject(v){isLoaderObject=v}},1);var NullLog;module.link('./loader-utils/null-log',{default(v){NullLog=v}},2);var getRegisteredLoaders;module.link('./register-loaders',{getRegisteredLoaders(v){getRegisteredLoaders=v}},3);var parseWithLoader,parseWithLoaderInBatches,parseWithLoaderSync;module.link('./parse-with-loader',{parseWithLoader(v){parseWithLoader=v},parseWithLoaderInBatches(v){parseWithLoaderInBatches=v},parseWithLoaderSync(v){parseWithLoaderSync=v}},4);





async function parse(data, loaders, options, url) {
  // Signature: parse(data, options, url)
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
    // TODO: throw error?
    return null;
  }

  normalizeLoader(loader);

  // Normalize options
  options = mergeLoaderAndUserOptions(options, loader);

  return await parseWithLoader(data, loader, options, url);
}

function parseSync(data, loaders, options, url) {
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

async function parseInBatches(data, loaders, options, url) {
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

async function parseInBatchesSync(data, loaders, options, url) {
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
