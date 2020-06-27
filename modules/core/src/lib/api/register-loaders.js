import {global} from '@loaders.gl/loader-utils';
import {normalizeLoader} from '../loader-utils/normalize-loader';

// HACK: We store this on a global object to increase the chance of cross-release interop
global.loaders = global.loaders || {};
global.loaders._registeredLoaders = global.loaders._registeredLoaders || [];

export function registerLoaders(loaders) {
  const {_registeredLoaders} = global.loaders;

  loaders = Array.isArray(loaders) ? loaders : [loaders];

  for (const loader of loaders) {
    const normalizedLoader = normalizeLoader(loader);
    if (!_registeredLoaders.find(registeredLoader => normalizedLoader === registeredLoader)) {
      // add to the beginning of the _registeredLoaders, so the last registeredLoader get picked
      _registeredLoaders.unshift(normalizedLoader);
    }
  }
}

export function getRegisteredLoaders() {
  const {_registeredLoaders} = global.loaders;
  return _registeredLoaders;
}

// For testing
export function _unregisterLoaders() {
  global.loaders._registeredLoaders = [];
}
