// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderOptions, FetchLike} from '@loaders.gl/loader-utils';
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
): FetchLike {
  const globalOptions = getGlobalLoaderOptions();

  const loaderOptions = options || globalOptions;
  const fetchOption = loaderOptions.fetch ?? loaderOptions.core?.fetch;

  // options.fetch can be a function
  if (typeof fetchOption === 'function') {
    return fetchOption;
  }

  // options.fetch can be an options object
  if (isObject(fetchOption)) {
    return (url) => fetchFile(url, fetchOption as RequestInit);
  }

  // else refer to context (from parent loader) if available
  if (context?.fetch) {
    return context?.fetch;
  }

  // else return the default fetch function
  return fetchFile;
}
