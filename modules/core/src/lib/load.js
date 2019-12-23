import {isFileReadable} from '../javascript-utils/is-type';
import {fetchFile} from './fetch/fetch-file';
import {isLoaderObject} from './loader-utils/normalize-loader';

import {parse} from './parse';

// Note: Load does duplicate a lot of parse.
// it can also call fetchFile on string urls, which `parse` won't do.
export async function load(url, loaders, options) {
  // Signature: load(url, options)
  if (!Array.isArray(loaders) && !isLoaderObject(loaders)) {
    options = loaders;
    loaders = null;
  }

  // at this point, `url` could be already loaded binary data
  let data = url;

  // url is a string, fetch the url
  if (typeof url === 'string') {
    data = await fetchFile(url, options);
  } else {
    url = null;
  }

  // URL is Blob or File, fetchFile handles it (alt: we could generate ObjectURL here)
  if (isFileReadable(url)) {
    // The fetch response object will contain blob.name
    data = await fetchFile(url, options);
    url = null;
  }

  // Data is loaded (at least we have a `Response` object) so time to hand over to `parse`
  return await parse(data, loaders, options, url);
}
