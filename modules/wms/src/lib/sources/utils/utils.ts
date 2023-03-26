// loaders.gl, MIT license

import type {LoaderOptions} from '@loaders.gl/loader-utils';

/**
 * Gets the current fetch function from options
 * @todo - move to loader-utils module
 * @todo - use in core module counterpart
 * @param options
 * @param context
 */
export function getFetchFunction(options?: LoaderOptions) {
  const fetchFunction = options?.fetch;

  // options.fetch can be a function
  if (fetchFunction && typeof fetchFunction === 'function') {
    return (url: string, fetchOptions?: RequestInit) => fetchFunction(url, fetchOptions);
  }

  // options.fetch can be an options object, use global fetch with those options
  const fetchOptions = options?.fetch;
  if (fetchOptions && typeof fetchOptions !== 'function') {
    return (url) => fetch(url, fetchOptions);
  }

  // else return the global fetch function
  return (url) => fetch(url);
}

export function mergeImageServiceProps<Props extends {loadOptions?: any}>(
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
