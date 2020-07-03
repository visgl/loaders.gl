import {assert} from '@loaders.gl/loader-utils';

export function isLoaderObject(loader) {
  if (!loader) {
    return false;
  }

  if (Array.isArray(loader)) {
    loader = loader[0];
  }

  let hasParser =
    loader.parseTextSync ||
    loader.parseSync ||
    loader.parse ||
    loader.parseStream || // TODO Remove, Replace with parseInBatches
    loader.parseInBatches;

  const loaderOptions = loader.options && loader.options[loader.id];
  hasParser = hasParser || (loaderOptions && loaderOptions.workerUrl);

  return hasParser;
}

export function normalizeLoader(loader) {
  // This error is fairly easy to trigger by mixing up import statments etc
  // So we make an exception and add a developer error message for this case
  // To help new users from getting stuck here
  assert(loader, 'null loader');
  assert(isLoaderObject(loader), 'invalid loader');

  // NORMALIZE [LOADER, OPTIONS] => LOADER

  // If [loader, options], create a new loaders object with options merged in
  let options;
  if (Array.isArray(loader)) {
    options = loader[1];
    loader = loader[0];
    loader = {
      ...loader,
      options: {...loader.options, ...options}
    };
  }

  // NORMALIZE LOADER.EXTENSIONS

  // Remove `extension`` prop, replace with `extensions``
  if (loader.extension) {
    loader.extensions = loader.extensions || loader.extension;
    delete loader.extension;
  }

  // Ensure loader.extensions is an array
  if (!Array.isArray(loader.extensions)) {
    loader.extensions = [loader.extensions];
  }

  assert(loader.extensions && loader.extensions.length > 0 && loader.extensions[0]);

  // NORMALIZE text and binary flags

  // Ensure at least one of text/binary flags are properly set
  if (loader.parseTextSync || loader.parseText) {
    loader.text = true;
  }

  if (!loader.text) {
    loader.binary = true;
  }

  return loader;
}
