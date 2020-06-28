import {global} from '@loaders.gl/loader-utils';
import {normalizeLoader} from '../loader-utils/normalize-loader';

// Store global registered loaders on the global object to increase chances of cross loaders-version interoperability
// NOTE: This use case is not reliable but can help when testing new versions of loaders.gl with existing frameworks
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
