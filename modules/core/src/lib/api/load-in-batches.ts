// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Loader,
  LoaderOptions,
  LoaderContext,
  BatchableDataType,
  LoaderBatchType,
  LoaderOptionsType,
  LoaderOptionsWithShape,
  LoaderShapeType
} from '@loaders.gl/loader-utils';
import {resolveLoaderAuthenticationOptions} from '@loaders.gl/loader-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {getFetchFunction} from '../loader-utils/get-fetch-function';
import {applySearchParamsToUrl} from '../loader-utils/option-utils';

import {parseInBatches} from './parse-in-batches';
import {selectLoader} from './select-loader';
import {getLoaderImplementation} from './load-loader';

type FileType = string | File | Blob | Response | (string | File | Blob | Response)[] | FileList;

/**
 * Parses `data` synchronously using a specified loader
 */
export async function loadInBatches<
  LoaderT extends Loader,
  OptionsT extends LoaderOptions = LoaderOptionsWithShape<
    LoaderOptionsType<LoaderT>,
    LoaderShapeType<LoaderT>
  >
>(
  files: FileType,
  loader: LoaderT,
  options?: OptionsT,
  context?: LoaderContext
): Promise<AsyncIterable<LoaderBatchType<LoaderT>>>;

/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function loadInBatches(
  files: FileType,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<AsyncIterable<unknown>>;

export function loadInBatches(
  files: FileType[] | FileList,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<AsyncIterable<unknown>>[];

export function loadInBatches(
  files: FileType | FileType[] | FileList,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<AsyncIterable<unknown>> | Promise<AsyncIterable<unknown>>[] {
  let loadersArray: Loader | Loader[] | undefined;
  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined; // context not supported in short signature
    options = loaders as LoaderOptions;
    loadersArray = undefined;
  } else {
    loadersArray = loaders as Loader | Loader[] | undefined;
  }

  // Single url/file
  if (!Array.isArray(files)) {
    return loadOneFileInBatches(files, loadersArray!, options || {});
  }

  // Multiple URLs / files
  const promises = files.map(file => loadOneFileInBatches(file, loadersArray!, options || {}));

  // No point in waiting here for all responses before starting to stream individual streams?
  return promises;
}

async function loadOneFileInBatches(
  file: FileType,
  loaders: Loader | Loader[],
  options: LoaderOptions
): Promise<AsyncIterable<unknown>> {
  if (typeof file === 'string') {
    const url = file;
    const loader = await selectLoader(url, loaders, {
      ...options,
      core: {...options.core, nothrow: true}
    });
    const authenticationLoader =
      loader && !loader.getAuthentications && options.core?.credentials?.length
        ? await getLoaderImplementation(loader, options, url)
        : loader;
    options = await resolveLoaderAuthenticationOptions(authenticationLoader, url, options);
    const fetch = getFetchFunction(options);
    const response = await fetch(applySearchParamsToUrl(url, options));
    // pick right overload
    return Array.isArray(loaders)
      ? await parseInBatches(response, loaders, options)
      : await parseInBatches(response, loaders, options);
  }
  // pick right overload
  return Array.isArray(loaders)
    ? await parseInBatches(file as BatchableDataType, loaders, options)
    : await parseInBatches(file as BatchableDataType, loaders, options);
}
