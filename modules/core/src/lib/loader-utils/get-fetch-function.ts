// loaders.gl, MIT license

import type {LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';
import {isObject} from '../../javascript-utils/is-type';
import {fetchFile} from '../fetch/fetch-file';
import {getGlobalLoaderOptions} from './option-utils';

/**
 * Gets the current fetch function from options and context
 * @param options
 * @param context
 */
export function getFetchFunction(
  options?: LoaderOptions,
  context?: Omit<LoaderContext, 'fetch'> & Partial<Pick<LoaderContext, 'fetch'>>
) {
  const globalOptions = getGlobalLoaderOptions();

  const fetchOptions = options || globalOptions;

  // options.fetch can be a function
  if (typeof fetchOptions.fetch === 'function') {
    return fetchOptions.fetch;
  }

  // options.fetch can be an options object
  if (isObject(fetchOptions.fetch)) {
    return (url) => fetchFile(url, fetchOptions as RequestInit);
  }

  // else refer to context (from parent loader) if available
  if (context?.fetch) {
    return context?.fetch;
  }

  // else return the default fetch function
  return fetchFile;
}
