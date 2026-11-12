// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  LoaderArrayOptionsType,
  LoaderShapeType,
  LoaderOptionsWithShape,
  LoaderCallOptions,
  DataType,
  Loader,
  LoaderContext,
  LoaderOptions,
  StrictLoaderOptions,
  LoaderOptionsType,
  LoaderReturnType,
  SourceLoader
} from '@loaders.gl/core/loader-utils';
import {
  isBlob,
  resolveAuthenticationOptions,
  resolveLoaderAuthenticationOptions
} from '@loaders.gl/core/loader-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {getNativeArrowOptions, unwrapArrowTable} from '../loader-utils/native-arrow';
import {getFetchFunction} from '../loader-utils/get-fetch-function';
import {
  applySearchParamsToUrl,
  normalizeLoaderOptions,
  normalizeOptions,
  getGlobalLoaderOptions
} from '../loader-utils/option-utils';

import {parse} from './parse';
import {selectLoader} from './select-loader';
import {getLoaderImplementation, isLoaderWithParser} from './load-loader';

type ParsedLoadResult<LoaderT, Options = never> = LoaderT extends SourceLoader
  ? never
  : LoaderReturnType<LoaderT, Options>;

/**
 * Parses `data` using a specified loader
 * Note: Load does duplicate a lot of parse.
 * it can also call fetchFile on string urls, which `parse` won't do.
 * @param data
 * @param loaders
 * @param options
 * @param context
 */

export async function load<LoaderT extends Loader>(
  url: string | DataType,
  loader: LoaderT,
  options?: undefined,
  context?: LoaderContext
): Promise<ParsedLoadResult<LoaderT>>;

export async function load<
  LoaderT extends Loader,
  const OptionsT extends LoaderOptions = LoaderOptionsWithShape<
    LoaderOptionsType<LoaderT>,
    LoaderShapeType<LoaderT>
  >
>(
  url: string | DataType,
  loader: LoaderT,
  options?: OptionsT & LoaderCallOptions<NoInfer<LoaderT>, NoInfer<OptionsT>>,
  context?: LoaderContext
): Promise<ParsedLoadResult<LoaderT, OptionsT>>;

export async function load<LoaderArrayT extends Loader[]>(
  url: string | DataType,
  loaders: LoaderArrayT,
  options?: undefined,
  context?: LoaderContext
): Promise<ParsedLoadResult<LoaderArrayT[number]>>;

export async function load<
  LoaderArrayT extends Loader[],
  const OptionsT extends LoaderOptions = LoaderArrayOptionsType<LoaderArrayT>
>(
  url: string | DataType,
  loaders: LoaderArrayT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<ParsedLoadResult<LoaderArrayT[number], OptionsT>>;

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

  resolvedOptions ||= getGlobalLoaderOptions();

  if (typeof url === 'string' || isBlob(url)) {
    const selectedLoader = await selectLoader(url, resolvedLoaders as Loader | Loader[], {
      ...resolvedOptions,
      core: {...resolvedOptions?.core, nothrow: true}
    });

    if (selectedLoader && typeof url === 'string') {
      const loaderImplementation = await getLoaderImplementation(
        selectedLoader,
        resolvedOptions,
        url
      );
      if (loaderImplementation.createDataSourceSync && !isLoaderWithParser(loaderImplementation)) {
        throw new Error(
          `${selectedLoader.id} creates sources. Use createDataSource() instead of load().`
        );
      }
      resolvedOptions = await resolveLoaderAuthenticationOptions(
        selectedLoader.getAuthentications ? selectedLoader : loaderImplementation,
        url,
        resolvedOptions || {}
      );
      const {parseUrl} = loaderImplementation;
      if (parseUrl) {
        const requestUrl = applySearchParamsToUrl(url, resolvedOptions);
        const nativeOptions = getNativeArrowOptions(
          selectedLoader,
          normalizeOptions(resolvedOptions, selectedLoader, [selectedLoader], url)
        );
        const result = await parseUrl(
          requestUrl,
          (nativeOptions || resolvedOptions) as StrictLoaderOptions,
          context
        );
        return nativeOptions ? unwrapArrowTable(result) : result;
      }
    }
  }

  // Select fetch function
  if (resolvedOptions) resolvedOptions = resolveAuthenticationOptions(resolvedOptions);
  const fetch = getFetchFunction(resolvedOptions);

  // at this point, `url` could be already loaded binary data
  let data = url;
  // url is a string, fetch the url
  if (typeof url === 'string') {
    data = await fetch(applySearchParamsToUrl(url, resolvedOptions));
    // URL is Blob or File, fetchFile handles it (alt: we could generate ObjectURL here)
  }

  if (isBlob(url)) {
    // The fetch response object will contain blob.name
    // @ts-expect-error TODO - This may not work for overridden fetch functions
    data = await fetch(url);
  }

  if (typeof url === 'string') {
    const normalizedOptions = normalizeLoaderOptions(resolvedOptions || {});
    if (!normalizedOptions.core?.baseUrl) {
      resolvedOptions = {
        ...resolvedOptions,
        core: {
          ...resolvedOptions?.core,
          baseUrl: url
        }
      };
    }
  }

  // Data is loaded (at least we have a `Response` object) so time to hand over to `parse`
  // return await parse(data, loaders as Loader[], options);
  return Array.isArray(resolvedLoaders)
    ? await parse(data, resolvedLoaders, resolvedOptions, context) // loader array overload
    : await parse(data, resolvedLoaders, resolvedOptions, context); // single loader overload
}
