// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DataSourceOptions,
  DataType,
  Loader,
  LoaderOptionsType,
  SourceArrayOptionsType,
  SourceLoader
} from '@loaders.gl/core/loader-utils';
import {
  isSourceLoader,
  resolveAuthenticationOptions,
  resolveLoaderAuthenticationOptions
} from '@loaders.gl/core/loader-utils';
import {coreApi} from './core-api';
import {getLoaderImplementationSync} from './load-loader';
import {preload} from './preload';
import {selectLoader, selectLoaderSync} from './select-loader';

type SourceOptions<Loaders extends readonly Loader[]> = SourceLoader extends Loaders[number]
  ? DataSourceOptions
  : Loaders extends readonly SourceLoader[]
    ? SourceArrayOptionsType<[...Loaders]>
    : LoaderOptionsType<Loaders[number]> & DataSourceOptions;

type SourceResult<LoaderT> = LoaderT extends {
  createDataSourceSync: (...args: any[]) => infer Source;
}
  ? Source
  : LoaderT extends {preload: (...args: any[]) => infer Implementation}
    ? SourceResult<Awaited<Implementation>>
    : LoaderT extends Loader<any, any, any, infer Source>
      ? Source
      : unknown;

/** Selects and preloads a loader, then constructs its data source. */
export async function createDataSource<const Loaders extends readonly Loader[]>(
  data: unknown,
  loaders: Loaders,
  options?: NoInfer<SourceOptions<Loaders>>
): Promise<SourceResult<Loaders[number]>>;
export async function createDataSource<LoaderT extends Loader>(
  data: unknown,
  loader: LoaderT,
  options?: NoInfer<SourceOptions<[LoaderT]>>
): Promise<SourceResult<LoaderT>>;
export async function createDataSource(
  data: unknown,
  loaders: Loader | readonly Loader[],
  options: DataSourceOptions = {}
): Promise<unknown> {
  options.signal?.throwIfAborted();
  const candidates = getCandidates(loaders, options);
  const loader =
    candidates.length === 1
      ? candidates[0]
      : await selectLoader(
          data as DataType,
          candidates,
          getSelectionOptions(options),
          undefined,
          'source'
        );
  if (!loader) {
    throw new Error('No explicit source loader matches the input');
  }

  const url = typeof data === 'string' ? data : '';
  const implementation = await preload(loader, options, url);
  options.signal?.throwIfAborted();
  const authenticatedOptions = await resolveLoaderAuthenticationOptions(
    loader.getAuthentications ? loader : implementation,
    url,
    options
  );
  options.signal?.throwIfAborted();
  return constructSource(implementation, data, authenticatedOptions);
}

/** Constructs a data source using an already available loader implementation. */
export function createDataSourceSync<const Loaders extends readonly Loader[]>(
  data: unknown,
  loaders: Loaders,
  options?: NoInfer<SourceOptions<Loaders>>
): SourceResult<Loaders[number]>;
export function createDataSourceSync<LoaderT extends Loader>(
  data: unknown,
  loader: LoaderT,
  options?: NoInfer<SourceOptions<[LoaderT]>>
): SourceResult<LoaderT>;
export function createDataSourceSync(
  data: unknown,
  loaders: Loader | readonly Loader[],
  options: DataSourceOptions = {}
): unknown {
  const candidates = getCandidates(loaders, options);
  const loader =
    candidates.length === 1
      ? candidates[0]
      : selectLoaderSync(
          data as DataType,
          candidates,
          getSelectionOptions(options),
          undefined,
          'source'
        );
  if (!loader) {
    throw new Error('No explicit source loader matches the input');
  }

  const implementation = getLoaderImplementationSync(loader, options);
  if (!implementation) {
    throw new Error(
      `${loader.id} has no synchronous source factory available. Call preload() first.`
    );
  }
  const authenticationLoader = loader.getAuthentications ? loader : implementation;
  const contributions = options.core?.credentials?.length
    ? authenticationLoader.getAuthentications?.(typeof data === 'string' ? data : '', options)
    : undefined;
  if (contributions && 'then' in contributions) {
    void contributions.catch(() => {});
    throw new Error('Use createDataSource() with an asynchronous getAuthentications() hook.');
  }
  const authenticatedOptions = resolveAuthenticationOptions(
    contributions?.length
      ? {
          ...options,
          core: {
            ...options.core,
            authentications: [...(options.core?.authentications || []), ...contributions]
          }
        }
      : options
  );
  return constructSource(implementation, data, authenticatedOptions);
}

/** Preserves legacy source type selection while allowing ordinary format loaders. */
function getCandidates(loaders: Loader | readonly Loader[], options: DataSourceOptions): Loader[] {
  const candidates = Array.isArray(loaders) ? [...loaders] : [loaders as Loader];
  const type = options.core?.type || options.type;
  return candidates.length > 1 && type && type !== 'auto'
    ? candidates.filter(loader => isSourceLoader(loader) && loader.type === type)
    : candidates;
}

function getSelectionOptions(options: DataSourceOptions): DataSourceOptions {
  return {...options, core: {...options.core, ignoreRegisteredLoaders: true, nothrow: true}};
}

function constructSource(loader: Loader, data: unknown, options: DataSourceOptions): unknown {
  if (loader.createDataSourceSync) {
    return loader.createDataSourceSync(data, options, coreApi);
  }
  throw new Error(
    `${loader.id} has no synchronous source factory. Use createDataSource() to preload the loader.`
  );
}
