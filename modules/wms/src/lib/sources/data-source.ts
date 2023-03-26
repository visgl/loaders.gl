// loaders.gl, MIT license

import type {LoaderOptions} from '@loaders.gl/loader-utils';

export type DataSourceProps = {
  /** LoaderOptions provide an option to override `fetch`. Will also be passed to any sub loaders */
  loadOptions?: LoaderOptions;
};

/** base class of all data sources */
export abstract class DataSource {
  /** A resolved fetch function extracted from loadOptions prop */
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  /** The actual load options, if calling a loaders.gl loader */
  loadOptions: LoaderOptions;

  constructor(props: DataSourceProps) {
    this.loadOptions = {...props.loadOptions};
    this.fetch = getFetchFunction(this.loadOptions);
  }
}

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
