// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, LoaderOptions, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {Source, SourceArrayOptionsType, SourceArrayDataSourceType} from '@loaders.gl/loader-utils';
import {fetchFile} from '../fetch/fetch-file';
import {parse} from './parse';
import {parseSync} from './parse-sync';
import {parseInBatches} from './parse-in-batches';
import {load} from './load';
import {loadInBatches} from './load-in-batches';

/**
 * Creates a source from a service
 * If type is not supplied, will try to automatically detect the the
 * @param url URL to the data source
 * @param type type of source. if not known, set to 'auto'
 * @returns an DataSource instance
 */
// DataSourceOptionsT extends DataSourceOptions = DataSourceOptions,
// DataSourceT extends DataSource = DataSource
export function createDataSource<SourceArrayT extends Source[]>(
  data: string | Blob,
  sources: Readonly<SourceArrayT>,
  options: Readonly<SourceArrayOptionsType<SourceArrayT>>
): SourceArrayDataSourceType<SourceArrayT> {
  const type = options?.core?.type || (options.type as unknown as string) || 'auto';
  const source = type === 'auto' ? selectSource(data, sources) : getSourceOfType(type, sources);

  if (!source) {
    throw new Error('Not a valid source type');
  }
  return source.createDataSource(data, options, createCoreApi(options?.core?.loadOptions));
}

function createCoreApi(loadOptions?: StrictLoaderOptions): CoreAPI {
  const sharedLoadOptions = normalizeCoreApiLoadOptions(loadOptions);
  return {
    fetchFile: (urlOrData, fetchOptions) =>
      fetchFile(urlOrData, mergeFetchOptions(sharedLoadOptions, fetchOptions)),
    parse: (data, loaders, options, context) =>
      parse(data, loaders as any, mergeLoadOptions(sharedLoadOptions, options), context),
    parseSync: (data, loaders, options, context) =>
      parseSync(data, loaders as any, mergeLoadOptions(sharedLoadOptions, options), context),
    parseInBatches: (data, loaders, options, context) =>
      parseInBatches(data, loaders as any, mergeLoadOptions(sharedLoadOptions, options), context),
    load: (data, loaders, nestedLoadOptions) =>
      load(data, loaders as any, mergeLoadOptions(sharedLoadOptions, nestedLoadOptions)),
    loadInBatches: (files, loaders, options, context) =>
      loadInBatches(
        files as any,
        loaders as any,
        mergeLoadOptions(sharedLoadOptions, options),
        context
      )
  };
}

function normalizeCoreApiLoadOptions(loadOptions?: StrictLoaderOptions): StrictLoaderOptions {
  return loadOptions ? mergeLoadOptions({}, loadOptions) : {};
}

function mergeLoadOptions(base: StrictLoaderOptions, nested?: LoaderOptions): StrictLoaderOptions {
  if (!nested) {
    return {
      ...base,
      core: base.core ? {...base.core} : undefined
    } as StrictLoaderOptions;
  }

  const merged = {...base, ...nested} as StrictLoaderOptions;
  if (base.core || nested.core) {
    merged.core = {...base.core, ...nested.core};
  }
  return merged;
}

function mergeFetchOptions(
  loadOptions: StrictLoaderOptions,
  fetchOptions?: RequestInit
): RequestInit | undefined {
  const defaultFetchOptions =
    loadOptions.core?.fetch && typeof loadOptions.core.fetch !== 'function'
      ? loadOptions.core.fetch
      : undefined;
  if (!defaultFetchOptions) {
    return fetchOptions;
  }
  if (!fetchOptions) {
    return defaultFetchOptions;
  }

  const mergedOptions: RequestInit = {...defaultFetchOptions, ...fetchOptions};
  if (defaultFetchOptions.headers || fetchOptions.headers) {
    mergedOptions.headers = new Headers(defaultFetchOptions.headers);
    new Headers(fetchOptions.headers).forEach((value, key) =>
      (mergedOptions.headers as Headers).set(key, value)
    );
  }
  return mergedOptions;
}

// TODO - use selectSource...

/** Guess service type from URL */
function selectSource<SourceArrayT extends Source[]>(
  url: string | Blob,
  sources: Readonly<SourceArrayT>
): SourceArrayT[number] | null {
  for (const service of sources) {
    // @ts-expect-error
    if (service.testURL && service.testURL(url)) {
      return service;
    }
  }

  return null;
}

/** Guess service type from URL */
function getSourceOfType(type: string, sources: Readonly<Source[]>): Source | null {
  for (const service of sources) {
    if (service.type === type) {
      return service;
    }
  }
  return null;
}
