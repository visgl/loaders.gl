import type {LoaderWithParser, LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';
import {isLoaderObject} from '../loader-utils/normalize-loader';
import {getFetchFunction} from '../loader-utils/option-utils';

import {parseInBatches} from './parse-in-batches';

type FileType = string | File | Blob | Response | (string | File | Blob | Response)[] | FileList;

/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function loadInBatches(
  url: FileType,
  loaders?: LoaderWithParser | LoaderWithParser[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<AsyncIterable<any>>;

export function loadInBatches(
  files: FileType[] | FileList,
  options?: LoaderOptions,
  context?: LoaderContext,
  empty?: null
): Promise<AsyncIterable<any>>;

export function loadInBatches(files, loaders, options, context) {
  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined; // context not supported in short signature
    options = loaders;
    loaders = null;
  }

  // Select fetch function
  const fetch = getFetchFunction(options || {});

  // Single url/file
  if (!Array.isArray(files)) {
    return loadOneFileInBatches(files, loaders, options, fetch);
  }

  // Multiple URLs / files
  const promises = files.map((file) => loadOneFileInBatches(file, loaders, options, fetch));

  // No point in waiting here for all responses before starting to stream individual streams?
  return promises;
}

async function loadOneFileInBatches(file, loaders, options, fetch) {
  if (typeof file === 'string') {
    const url = file;
    const response = await fetch(url);
    return await parseInBatches(response, loaders, options);
  }
  return await parseInBatches(file, loaders, options);
}
