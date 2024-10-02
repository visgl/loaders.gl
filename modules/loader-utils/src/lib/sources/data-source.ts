// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions, Loader} from '../../loader-types';
import type {RequiredOptions} from '../option-utils/merge-options';
import {mergeOptions} from '../option-utils/merge-options';
import {resolvePath} from '../path-utils/file-aliases';

/** Common properties for all data sources */
export type DataSourceOptions = Partial<{
  core: {
    /** Allows application to specify which source should be selected. Matches `Source.type`. Defaults to 'auto' */
    type?: string;
    /** Any dataset attributions (in case underlying metadata does not include attributions) */
    attributions?: string[];
    /** LoaderOptions provide an option to override `fetch`. Will also be passed to any sub loaders */
    loadOptions?: LoaderOptions;
    /** Make additional loaders available to the data source */
    loaders?: Loader[];
  };
  [key: string]: Record<string, unknown>;
}>;

/** base class of all data sources */
export abstract class DataSource<DataT, OptionsT extends DataSourceOptions> {
  static defaultOptions: Required<DataSourceOptions> = {
    core: {
      type: 'auto',
      attributions: [],
      loadOptions: {},
      loaders: []
    }
  };

  optionsType?: OptionsT & DataSourceOptions;
  options: Required<OptionsT & DataSourceOptions>;
  readonly data: DataT;
  readonly url: string;

  /** The actual load options, if calling a loaders.gl loader */
  loadOptions: LoaderOptions;
  /** A resolved fetch function extracted from loadOptions prop */
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  _needsRefresh: boolean = true;

  constructor(
    data: DataT,
    options: OptionsT,
    defaultOptions?: Omit<RequiredOptions<OptionsT>, 'core'>
  ) {
    if (defaultOptions) {
      // @ts-expect-error Typescript gets confused
      this.options = mergeOptions({...defaultOptions, core: DataSource.defaultOptions}, options);
    } else {
      // @ts-expect-error
      this.options = {...options};
    }
    this.data = data;
    this.url = typeof data === 'string' ? resolvePath(data) : '';
    this.loadOptions = {...this.options.core?.loadOptions};
    this.fetch = getFetchFunction(this.loadOptions);
  }

  setProps(options: OptionsT) {
    this.options = Object.assign(this.options, options);
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
