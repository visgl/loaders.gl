// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderContext, LoaderOptions, StrictLoaderOptions} from '../../loader-types';
import type {BatchableDataType, DataType, SyncDataType} from '../../types';
import type {ReadableFile} from '../files/file';
import {mergeOptions} from '../option-utils/merge-options';
import {resolvePath} from '../path-utils/file-aliases';
import {getLoaderLog} from '../log-utils/log';
import {getAuthenticatedFetch} from '../request-utils/request-credentials';
import {resolveAuthenticationOptions} from '../request-utils/authentication';

/** Common properties for all data sources */
export type DataSourceOptions = StrictLoaderOptions & {
  /** Removed in v5. Pass parser options directly in their loader namespaces. */
  loadOptions?: never;
  core?: StrictLoaderOptions['core'] & {
    /** Allows application to specify which source should be selected. Matches `Source.type`. Defaults to 'auto' */
    type?: string;
    /** Stable query-visible source name. Defaults to an available data or file name. */
    name?: string;
    /** Any dataset attributions (in case underlying metadata does not include attributions) */
    attributions?: string[];
    /** Removed in v5. Move these options to `core` and the root loader namespaces. */
    loadOptions?: never;
    /** Make additional loaders available to the data source */
    loaders?: Loader[];
    /** Called when source-level initialization or metadata loading fails. */
    onError?: (error: Error, source: DataSource<any, any>) => void;
  };
};

/** Runtime hooks injected when a DataSource is created through an integration layer such as `@loaders.gl/core`. */
export type CoreAPI = Readonly<{
  fetchFile: (urlOrData: string | Blob, fetchOptions?: RequestInit) => Promise<Response>;
  parse: (
    data: DataType | Promise<DataType>,
    loaders?: Loader | Loader[] | LoaderOptions,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => Promise<unknown>;
  parseFile: (
    file: ReadableFile,
    loaders?: Loader | Loader[] | LoaderOptions,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => Promise<unknown>;
  parseSync: (
    data: SyncDataType,
    loaders?: Loader | Loader[] | LoaderOptions,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => unknown;
  parseInBatches: (
    data: BatchableDataType,
    loaders?: Loader | Loader[] | LoaderOptions,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => Promise<AsyncIterable<unknown> | Iterable<unknown>>;
  load: (
    url: string | DataType,
    loaders?: Loader[] | LoaderOptions | Loader,
    options?: LoaderOptions | LoaderContext,
    context?: LoaderContext
  ) => Promise<unknown>;
  loadInBatches: (
    files: string | File | Blob | Response | (string | File | Blob | Response)[] | FileList,
    loaders?: Loader[] | LoaderOptions | Loader,
    options?: LoaderOptions,
    context?: LoaderContext
  ) => Promise<AsyncIterable<unknown>> | Promise<AsyncIterable<unknown>>[];
}>;

const UNAVAILABLE_CORE_API: CoreAPI = {
  fetchFile: unavailableCoreApiMethod('fetchFile'),
  parse: unavailableCoreApiMethod('parse'),
  parseFile: unavailableCoreApiMethod('parseFile'),
  parseSync: unavailableCoreApiMethod('parseSync'),
  parseInBatches: unavailableCoreApiMethod('parseInBatches'),
  load: unavailableCoreApiMethod('load'),
  loadInBatches: unavailableCoreApiMethod('loadInBatches')
};

/** base class of all data sources */
export abstract class DataSource<DataT, OptionsT extends DataSourceOptions> {
  static defaultOptions = {
    core: {
      type: 'auto',
      attributions: [],
      loaders: [],
      onError: undefined!
    }
  } satisfies DataSourceOptions;

  optionsType?: OptionsT & DataSourceOptions;
  options: Required<OptionsT & DataSourceOptions>;
  readonly data: DataT;
  readonly url: string;
  /** Stable query-visible name, resolved without fetching source data. */
  readonly name: string;

  /** Shared parser options derived from the source options, excluding source-only core controls. */
  loadOptions: StrictLoaderOptions;
  /** A resolved fetch function extracted from the shared core options. */
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  /** Shared source-level runtime hooks, when supplied by the source factory. */
  readonly coreApi: CoreAPI;
  /** Whether a real CoreAPI instance was injected by the integration layer. */
  readonly hasCoreApi: boolean;
  _needsRefresh: boolean = true;

  constructor(
    data: DataT,
    options: OptionsT,
    defaultOptions?: Partial<OptionsT>,
    coreApi?: CoreAPI
  ) {
    this.options = mergeOptions<DataSourceOptions>(
      mergeOptions<DataSourceOptions>(DataSource.defaultOptions, defaultOptions || {}),
      options
    ) as Required<OptionsT & DataSourceOptions>;
    this.data = data;
    this.url = typeof data === 'string' ? resolvePath(data) : '';
    this.name = getDataSourceName(data, this.options);
    const loadOptions = resolveAuthenticationOptions(getSourceLoaderOptions(this.options));
    this.loadOptions = loadOptions;
    const fetch = getFetchFunction(loadOptions);
    this.coreApi = coreApi || UNAVAILABLE_CORE_API;
    this.hasCoreApi = Boolean(coreApi);
    this.fetch = fetch;
  }

  setProps(options: OptionsT) {
    if (options.core?.name !== undefined && options.core.name !== this.name)
      throw new Error('Data source names are fixed at creation.');
    const mergedOptions = mergeOptions<DataSourceOptions>(this.options, options) as Required<
      OptionsT & DataSourceOptions
    >;
    const loadOptions = resolveAuthenticationOptions(getSourceLoaderOptions(mergedOptions));
    this.options = mergedOptions;
    this.loadOptions = loadOptions;
    this.fetch = getFetchFunction(loadOptions);
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

  /** Reports a source-level failure through the configured callback or the shared logger. */
  protected reportError(error: unknown, message: string): Error {
    const normalizedError = normalizeError(error, message);
    const callback = this.options.core?.onError;
    if (callback) {
      callback(normalizedError, this);
    } else {
      getLoaderLog(this.options).warn(`${this.constructor.name}: ${normalizedError.message}`)();
    }
    return normalizedError;
  }
}

/**
 * Gets the current fetch function from options
 * @todo - move to loader-utils module
 * @todo - use in core module counterpart
 * @param options
 * @param context
 */
export function getFetchFunction(options?: StrictLoaderOptions) {
  return getAuthenticatedFetch(options);
}

/**
 * Derives parser options from flat source options without forwarding source controls to workers.
 * Removed option wrappers are rejected so JavaScript callers receive actionable migration guidance.
 */
export function getSourceLoaderOptions(options: DataSourceOptions): StrictLoaderOptions {
  if (options.loadOptions !== undefined || options.core?.loadOptions !== undefined) {
    throw new Error(
      'Source loadOptions and core.loadOptions were removed. Use core and root loader namespaces directly.'
    );
  }
  const loadOptions: LoaderOptions = {...options};
  if (options?.core) {
    loadOptions.core = {...options.core};
    const parserCore = loadOptions.core as Record<string, unknown>;
    for (const key of ['type', 'name', 'attributions', 'loaders', 'onError', 'loadOptions']) {
      delete parserCore[key];
    }
    if (Object.keys(parserCore).length === 0) {
      delete loadOptions.core;
    }
  }

  return loadOptions as StrictLoaderOptions;
}

/** Normalizes arbitrary thrown values to `Error` instances for source-level reporting. */
function normalizeError(error: unknown, message: string): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error(message);
}

function unavailableCoreApiMethod(methodName: keyof CoreAPI) {
  return () => {
    throw new Error(
      `CoreAPI.${methodName} is unavailable. Use @loaders.gl/core.createDataSourceSync().`
    );
  };
}

/** Derives a stable identifier from explicit options or already available data metadata. */
function getDataSourceName(data: unknown, options: DataSourceOptions): string {
  const explicitName = options.core?.name;
  if (explicitName !== undefined) {
    if (typeof explicitName !== 'string' || !explicitName.trim())
      throw new Error('Data source name must be a non-empty string.');
    return explicitName;
  }
  if (data && typeof data === 'object') {
    const named = data as {
      name?: unknown;
      schema?: {metadata?: Map<string, unknown> | Record<string, unknown>};
    };
    if (typeof named.name === 'string' && named.name.trim())
      return data instanceof Blob ? removeFileExtension(named.name) : named.name;
    const metadata = named.schema?.metadata;
    const embeddedName = metadata instanceof Map ? metadata.get('name') : metadata?.name;
    if (typeof embeddedName === 'string' && embeddedName.trim()) return embeddedName;
  }
  if (typeof data === 'string') {
    try {
      const url = new URL(data.replace(/\\/g, '/'), 'https://source.invalid/');
      if (!['data:', 'blob:'].includes(url.protocol)) {
        let basename = url.pathname.split('/').filter(Boolean).pop();
        if (basename) {
          try {
            basename = decodeURIComponent(basename);
          } catch {
            /* Keep malformed encoded names literal. */
          }
          return removeFileExtension(basename);
        }
      }
    } catch {
      /* Invalid URLs still receive a source-type fallback name. */
    }
  }
  return options.core?.type && options.core.type !== 'auto' ? options.core.type : 'source';
}

/** Removes a filename suffix without erasing a hidden filename. */
function removeFileExtension(name: string): string {
  const extension = name.lastIndexOf('.');
  return extension > 0 ? name.slice(0, extension) : name;
}
