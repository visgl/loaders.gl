// loaders.gl, MIT license

import type {DataType, Loader, LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';
import type {LoaderOptionsType, LoaderReturnType} from '@loaders.gl/loader-utils';
import {isBlob} from '../../javascript-utils/is-type';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {getFetchFunction} from '../loader-utils/option-utils';

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

export async function load<LoaderT extends Loader>(
  url: string | DataType,
  loader: LoaderT,
  options?: LoaderOptionsType<LoaderT>,
  context?: LoaderContext
): Promise<LoaderReturnType<LoaderT>>;

export async function load<
  LoaderT extends Loader,
  LoaderOptionsT extends LoaderOptions = LoaderOptions
>(
  url: string | DataType,
  loaders: Loader[] | LoaderOptions,
  options?: LoaderOptionsT,
  context?: LoaderContext
): Promise<any>;

// implementation signature
export async function load<LoaderOptionsT extends LoaderOptions>(
  url: string | DataType,
  loaders?: Loader[] | LoaderOptions,
  options?: LoaderOptionsT,
  context?: LoaderContext
): Promise<any> {
  let resolvedLoaders: Loader | Loader[];
  let resolvedOptions: LoaderOptionsT | undefined;

  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    resolvedLoaders = [];
    resolvedOptions = loaders as LoaderOptionsT;
    context = undefined; // context not supported in short signature
  } else {
    resolvedLoaders = loaders as Loader | Loader[];
    resolvedOptions = options;
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
    data = await fetch(url);
  }

  // Data is loaded (at least we have a `Response` object) so time to hand over to `parse`
  return Array.isArray(resolvedLoaders)
    ? await parse(data, resolvedLoaders, resolvedOptions) // loader array overload
    : await parse(data, resolvedLoaders, resolvedOptions); // single loader overload
}
