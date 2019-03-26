import {normalizeLoader} from '../loader-encoder-utils/normalize-loader';

const registeredLoaders = [];

export function registerLoaders(loaders) {
  loaders = Array.isArray(loaders) ? loaders : [loaders];
  registeredLoaders.push(loaders.map(loader => normalizeLoader(loader)));
}

export function getRegisteredLoaders() {
  return registeredLoaders;
}
