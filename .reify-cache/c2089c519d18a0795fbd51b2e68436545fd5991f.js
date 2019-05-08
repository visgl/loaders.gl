"use strict";module.export({registerLoaders:()=>registerLoaders,getRegisteredLoaders:()=>getRegisteredLoaders});var normalizeLoader;module.link('./loader-utils/normalize-loader',{normalizeLoader(v){normalizeLoader=v}},0);

const registeredLoaders = {};

function registerLoaders(loaders) {
  loaders = Array.isArray(loaders) ? loaders : [loaders];
  for (const loader of loaders) {
    normalizeLoader(loader);
    for (const extension of loader.extensions) {
      registeredLoaders[extension] = loader;
    }
  }
}

function getRegisteredLoaders() {
  return Object.values(registeredLoaders);
}
