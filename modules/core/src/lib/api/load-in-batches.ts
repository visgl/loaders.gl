// loaders.gl, MIT license

import type {
  LoaderWithParser,
  LoaderOptions,
  LoaderContext,
  FetchLike
} from '@loaders.gl/loader-utils';
import type {LoaderBatchType, LoaderOptionsType} from '@loaders.gl/loader-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {getFetchFunction} from '../loader-utils/get-fetch-function';

import {parseInBatches} from './parse-in-batches';

type FileType = string | File | Blob | Response | (string | File | Blob | Response)[] | FileList;

/**
 * Parses `data` synchronously using a specified loader
 */
export async function loadInBatches<
  LoaderT extends LoaderWithParser,
  OptionsT extends LoaderOptions = LoaderOptionsType<LoaderT>
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
  loaders?: LoaderWithParser | LoaderWithParser[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<AsyncIterable<unknown>>;

export function loadInBatches(
  files: FileType[] | FileList,
  loaders?: LoaderWithParser | LoaderWithParser[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<AsyncIterable<unknown>>[];

export function loadInBatches(
  files: FileType | FileType[] | FileList,
  loaders?: LoaderWithParser | LoaderWithParser[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<AsyncIterable<unknown>> | Promise<AsyncIterable<unknown>>[] {
  let loadersArray: LoaderWithParser | LoaderWithParser[] | undefined;
  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined; // context not supported in short signature
    options = loaders as LoaderOptions;
    loadersArray = undefined;
  } else {
    loadersArray = loaders as LoaderWithParser | LoaderWithParser[] | undefined;
  }

  // Select fetch function
  const fetch = getFetchFunction(options || {});

  // Single url/file
  if (!Array.isArray(files)) {
    return loadOneFileInBatches(files, loadersArray!, options || {}, fetch);
  }

  // Multiple URLs / files
  const promises = files.map((file) =>
    loadOneFileInBatches(file, loadersArray!, options || {}, fetch)
  );

  // No point in waiting here for all responses before starting to stream individual streams?
  return promises;
}

async function loadOneFileInBatches(
  file: FileType,
  loaders: LoaderWithParser | LoaderWithParser[],
  options: LoaderOptions,
  fetch: FetchLike
): Promise<AsyncIterable<unknown>> {
  if (typeof file === 'string') {
    const url = file;
    const response = await fetch(url);
    // @ts-expect-error
    return await parseInBatches(response, loaders, options);
  }
  // @ts-expect-error TODO
  return await parseInBatches(file, loaders, options);
}
