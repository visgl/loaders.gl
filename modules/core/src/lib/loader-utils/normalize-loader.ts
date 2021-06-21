import type {Loader} from '@loaders.gl/loader-utils';
import {assert} from '@loaders.gl/loader-utils';

export function isLoaderObject(loader?: any): boolean {
  if (!loader) {
    return false;
  }

  if (Array.isArray(loader)) {
    loader = loader[0];
  }

  const hasExtensions = Array.isArray(loader?.extensions);

  /* Now handled by types and worker loaders do not have these
  let hasParser =
    loader.parseTextSync ||
    loader.parseSync ||
    loader.parse ||
    loader.parseStream || // TODO Remove, Replace with parseInBatches
    loader.parseInBatches;
  */

  return hasExtensions;
}

export function normalizeLoader(loader: Loader): Loader {
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

  // NORMALIZE text and binary flags
  // Ensure at least one of text/binary flags are properly set

  // if (loader.parseTextSync || loader.parseText) {
  //   loader.text = true;
  // }

  if (!loader.text) {
    loader.binary = true;
  }

  return loader;
}
