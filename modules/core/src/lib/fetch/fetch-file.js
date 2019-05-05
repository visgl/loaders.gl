/* global fetch */
import {resolvePath} from './file-aliases';

// As fetch but respects pathPrefix and file aliases
// Reads file data from:
// * data urls
// * http/http urls
// * File/Blob objects (TBA)
export async function fetchFile(url, options) {
  url = resolvePath(url);
  // TODO - SUPPORT reading from `File` objects
  // if (typeof File !== 'undefined' && uri instanceof File) {
  //   readFileObject(uri, options);
  // }
  return fetch(url, options);
}
