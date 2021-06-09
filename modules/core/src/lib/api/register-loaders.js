import {normalizeLoader} from '../loader-utils/normalize-loader';
import {getGlobalLoaderState} from '../loader-utils/option-utils';

// Store global registered loaders on the global object to increase chances of cross loaders-version interoperability
// This use case is not reliable but can help when testing new versions of loaders.gl with existing frameworks
const getGlobalLoaderRegistry = () => {
  const state = getGlobalLoaderState();
  state.loaderRegistry = state.loaderRegistry || [];
  return state.loaderRegistry;
};

export function registerLoaders(loaders) {
  const loaderRegistry = getGlobalLoaderRegistry();

  loaders = Array.isArray(loaders) ? loaders : [loaders];

  for (const loader of loaders) {
    const normalizedLoader = normalizeLoader(loader);
    if (!loaderRegistry.find((registeredLoader) => normalizedLoader === registeredLoader)) {
      // add to the beginning of the loaderRegistry, so the last registeredLoader get picked
      loaderRegistry.unshift(normalizedLoader);
    }
  }
}

export function getRegisteredLoaders() {
  return getGlobalLoaderRegistry();
}

// For testing
export function _unregisterLoaders() {
  const state = getGlobalLoaderState();
  state.loaderRegistry = [];
}
