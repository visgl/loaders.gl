import {normalizeLoader} from '../loader-encoder-utils/normalize-loader';

const registeredLoaders = {};

export function registerLoaders(loaders) {
  loaders = Array.isArray(loaders) ? loaders : [loaders];
  loaders.forEach(loader => {
    normalizeLoader(loader);
    const key = loader.name || loader.extension;
    registeredLoaders[key] = loader;
  });
}

export function getRegisteredLoaders() {
  return Object.values(registeredLoaders);
}
