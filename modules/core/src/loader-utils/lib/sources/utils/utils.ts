// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '../../../loader-types';
import {getAuthenticatedFetch} from '../../request-utils/request-credentials';

/**
 * Gets the current fetch function from options
 * @todo - move to loader-utils module
 * @todo - use in core module counterpart
 * @param options
 * @param context
 */
export function getFetchFunction(options?: LoaderOptions) {
  return getAuthenticatedFetch(options);
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
