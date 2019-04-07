import {normalizeLoader} from './loader-utils/normalize-loader';

const registeredLoaders = {};

export function registerLoaders(loaders) {
  loaders = Array.isArray(loaders) ? loaders : [loaders];
  for (const loader of loaders) {
    normalizeLoader(loader);
    for (const extension of loader.extensions) {
      registeredLoaders[extension] = loader;
    }
  }
}

export function getRegisteredLoaders() {
  return Object.values(registeredLoaders);
}
