// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderOptions, FetchLike} from '@loaders.gl/loader-utils';
import {createAuthenticatedFetch, isObject} from '@loaders.gl/loader-utils';
import {fetchFile} from '../fetch/fetch-file';
import {getGlobalLoaderOptions} from './option-utils';

/**
 * Gets the current fetch function from options and context
 * @param options
 * @param context
 */
export function getFetchFunction(
  options?: LoaderOptions,
  context?: Omit<LoaderContext, 'fetch' | 'coreApi'> &
    Partial<Pick<LoaderContext, 'fetch' | 'coreApi'>>
): FetchLike {
  const globalOptions = getGlobalLoaderOptions();

  const loaderOptions = options || globalOptions;
  const fetchOption = loaderOptions.fetch ?? loaderOptions.core?.fetch;
  let fetchFunction: FetchLike;

  // options.fetch can be a function
  if (typeof fetchOption === 'function') {
    fetchFunction = fetchOption;
  } else if (isObject(fetchOption)) {
    fetchFunction = context?.fetch || fetchFile;
  } else if (context?.fetch) {
    fetchFunction = context.fetch;
  } else {
    fetchFunction = fetchFile;
  }

  return createAuthenticatedFetch({
    fetch: fetchFunction,
    credentials: loaderOptions.core?.credentials || [],
    authentications: loaderOptions.core?.authentications,
    fetchOptions: isObject(fetchOption) ? (fetchOption as RequestInit) : undefined
  });
}
