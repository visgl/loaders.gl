/* global fetch */
import {resolvePath} from '@loaders.gl/loader-utils';
import {isFileReadable} from '../../javascript-utils/is-type';
import fetchFileReadable from './fetch-file.browser';
import {getErrorMessageFromResponse} from './fetch-error-message';

// As fetch but respects pathPrefix and file aliases
// Reads file data from:
// * data urls
// * http/http urls
// * File/Blob objects
export async function fetchFile(url, options = {}) {
  if (isFileReadable(url)) {
    return fetchFileReadable(url, options);
  }
  url = resolvePath(url);
  // TODO - SUPPORT reading from `File` objects
  const response = await fetch(url, options);
  if (!response.ok && options.throws) {
    throw new Error(await getErrorMessageFromResponse(response));
  }
  return response;
}
