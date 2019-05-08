"use strict";module.export({loadInBatches:()=>loadInBatches,load:()=>load});var fetchFile;module.link('./fetch/fetch-file',{fetchFile(v){fetchFile=v}},0);var isLoaderObject;module.link('./loader-utils/normalize-loader',{isLoaderObject(v){isLoaderObject=v}},1);var autoDetectLoader;module.link('./loader-utils/auto-detect-loader',{autoDetectLoader(v){autoDetectLoader=v}},2);var parse,parseInBatches;module.link('./parse',{parse(v){parse=v},parseInBatches(v){parseInBatches=v}},3);var getRegisteredLoaders;module.link('./register-loaders',{getRegisteredLoaders(v){getRegisteredLoaders=v}},4);






async function loadInBatches(url, loaders, options) {
  const response = await fetchFile(url, options);
  return parseInBatches(response, loaders, options, url);
}

async function load(url, loaders, options) {
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
  let data = url;
  if (typeof data === 'string') {
    data = await fetchFile(url, options);
  }
  return parse(data, loaders, options, url);
}
