import type {DataType, Loader, LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';
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
// implementation signature
export async function load(
  url: string | DataType,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<any> {
  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = undefined; // context not supported in short signature
    options = loaders as LoaderOptions;
    loaders = undefined;
  }

  // Select fetch function
  const fetch = getFetchFunction(options);

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
  return await parse(data, loaders as Loader[], options);
}
