// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '../../../loader-types';
import {createAuthenticatedFetch} from '../../request-utils/request-credentials';

/**
 * Gets the current fetch function from options
 * @todo - move to loader-utils module
 * @todo - use in core module counterpart
 * @param options
 * @param context
 */
export function getFetchFunction(options?: LoaderOptions) {
  const fetchOption = options?.fetch ?? options?.core?.fetch;
  let fetchFunction: (url: string, requestOptions?: RequestInit) => Promise<Response>;

  if (typeof fetchOption === 'function') {
    fetchFunction = (url: string, requestOptions?: RequestInit) => fetchOption(url, requestOptions);
  } else if (fetchOption) {
    fetchFunction = (url, requestOptions) =>
      fetch(url, mergeFetchOptions(fetchOption, requestOptions));
  } else {
    fetchFunction = (url, requestOptions) => fetch(url, requestOptions);
  }

  return createAuthenticatedFetch({
    fetch: fetchFunction,
    credentials: options?.core?.credentials || []
  });
}

/** Combines static and per-request fetch options without replacing either header collection. */
function mergeFetchOptions(fetchOptions: RequestInit, requestOptions?: RequestInit): RequestInit {
  const mergedOptions: RequestInit = {...fetchOptions, ...requestOptions};
  if (fetchOptions.headers || requestOptions?.headers) {
    const headers = new Headers(fetchOptions.headers);
    new Headers(requestOptions?.headers).forEach((value, key) => headers.set(key, value));
    mergedOptions.headers = headers;
  }
  return mergedOptions;
}

export function mergeImageSourceLoaderProps<Props extends {loadOptions?: any}>(
  props: Props
): Required<Props> {
  // @ts-expect-error
  return {
    // Default fetch
    ...props,
    loadOptions: {
      ...props.loadOptions,
      fetch: getFetchFunction(props.loadOptions)
    }
  };
}
