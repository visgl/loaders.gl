// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DataType,
  Loader,
  LoaderContext,
  LoaderOptions,
  LoaderOptionsType,
  LoaderReturnType,
  LoaderArrayOptionsType,
  LoaderArrayReturnType
} from '@loaders.gl/loader-utils';
import {isBlob} from '../../javascript-utils/is-type';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {getFetchFunction} from '../loader-utils/get-fetch-function';

import {parse} from './parse';

/**
 * Parses `data` using a specified loader
 * Note: Load does duplicate a lot of parse.
 * it can also call fetchFile on string urls, which `parse` won't do.
 * @param data
 * @param loaders
 * @param options
 * @param context
 */

export async function load<
  LoaderT extends Loader,
  OptionsT extends LoaderOptions = LoaderOptionsType<LoaderT>
>(
  url: string | DataType,
  loader: LoaderT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<LoaderReturnType<LoaderT>>;

export async function load<
  LoaderArrayT extends Loader[],
  OptionsT extends LoaderOptions = LoaderArrayOptionsType<LoaderArrayT>
>(
  url: string | DataType,
  loaders: LoaderArrayT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<LoaderArrayReturnType<LoaderArrayT>>;

/**
 * Loads data asynchronously by matching a pre-registered loader
 * @deprecated Loader registration is deprecated, use load(data, loaders, options) instead
 */
export async function load(
  url: string | DataType,
  loaders?: LoaderOptions,
  context?: LoaderContext
): Promise<unknown>;

// export async function load(url: string | DataType, loaders: LoaderOptions): Promise<any>;

// implementation signature
export async function load(
  url: string | DataType,
  loaders?: Loader[] | LoaderOptions,
  options?: LoaderOptions | LoaderContext,
  context?: LoaderContext
): Promise<unknown> {
  let resolvedLoaders: Loader | Loader[];
  let resolvedOptions: LoaderOptions | undefined;

  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    resolvedLoaders = [];
    resolvedOptions = loaders as LoaderOptions;
    context = undefined; // context not supported in short signature
  } else {
    resolvedLoaders = loaders as Loader | Loader[];
    resolvedOptions = options as LoaderOptions;
  }

  // Select fetch function
  const fetch = getFetchFunction(resolvedOptions);

  // at this point, `url` could be already loaded binary data
  let data = url;
  // url is a string, fetch the url
  if (typeof url === 'string') {
    data = await fetch(url);
    // URL is Blob or File, fetchFile handles it (alt: we could generate ObjectURL here)
  }

  if (isBlob(url)) {
    // The fetch response object will contain blob.name
    // @ts-expect-error TODO - This may not work for overridden fetch functions
    data = await fetch(url);
  }

  // Data is loaded (at least we have a `Response` object) so time to hand over to `parse`
  // return await parse(data, loaders as Loader[], options);
  return Array.isArray(resolvedLoaders)
    ? await parse(data, resolvedLoaders, resolvedOptions) // loader array overload
    : await parse(data, resolvedLoaders, resolvedOptions); // single loader overload
}
