// loaders.gl, MIT license

import type {LoaderOptions} from '@loaders.gl/loader-utils';

export type DataSourceProps = {
  /** LoaderOptions provide an option to override `fetch`. Will also be passed to any sub loaders */
  loadOptions?: LoaderOptions;
};

/** base class of all data sources */
export abstract class DataSource<PropsT extends DataSourceProps> {
  /** A resolved fetch function extracted from loadOptions prop */
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  /** The actual load options, if calling a loaders.gl loader */
  loadOptions: LoaderOptions;
  _needsRefresh: boolean = true;

  props: PropsT;

  constructor(props: PropsT) {
    this.props = {...props};
    this.loadOptions = {...props.loadOptions};
    this.fetch = getFetchFunction(this.loadOptions);
  }

  setProps(props: PropsT) {
    this.props = Object.assign(this.props, props);
    // TODO - add a shallow compare to avoid setting refresh if no change?
    this.setNeedsRefresh();
  }

  /** Mark this data source as needing a refresh (redraw) */
  setNeedsRefresh(): void {
    this._needsRefresh = true;
  }

  /**
   * Does this data source need refreshing?
   * @note The specifics of the refresh mechanism depends on type of data source
   */
  getNeedsRefresh(clear: boolean = true) {
    const needsRefresh = this._needsRefresh;
    if (clear) {
      this._needsRefresh = false;
    }
    return needsRefresh;
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
