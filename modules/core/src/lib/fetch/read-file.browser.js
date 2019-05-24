// TODO - this file is not tested
/* global fetch */
import assert from '../../utils/assert';
import {isFile} from '../../javascript-utils/is-type';
import fetchFileObject from './fetch-file.browser';

const DEFAULT_OPTIONS = {
  dataType: 'arraybuffer',
  // TODO - this was mostly set to true to make test cases work
  nothrow: true
};

const isDataURL = url => url.startsWith('data:');

export async function readFileObject(file, options) {
  const response = fetchFileObject(file, options);
  return options.dataType === 'text' ? response.text() : response.arrayBuffer();
}

// In a few cases (data URIs, files under Node) "files" can be read synchronously
export function readFileSyncBrowser(uri, options) {
  options = getReadFileOptions(options);

  if (isDataURL(uri)) {
    // TODO - removed until decodeDataUri does not depend on Node.js Buffer
    //   return decodeDataUri(uri);
  }

  if (!options.nothrow) {
    // throw new Error('Cant load URI synchronously');
    assert(false);
  }

  return null;
}

// HELPER FUNCTIONS

function getReadFileOptions(options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  options.responseType = options.responseType || options.dataType;
  return options;
}

// DEPRECATED

// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
export async function readFile(uri, options = {}) {
  options = getReadFileOptions(options);

  // NOTE: data URLs are decoded by fetch

  // SUPPORT reading from `File` objects
  if (isFile(uri)) {
    readFileObject(uri, options);
  }

  // In a web worker, XMLHttpRequest throws invalid URL error if using relative path
  // resolve url relative to original base
  // TODO - merge this into `resolvePath?
  // uri = new URL(uri, location.href).href;

  // Browser: Try to load all URLS via fetch, as they can be local requests (e.g. to a dev server)
  const response = await fetch(uri, options);
  return response[options.dataType]();
}
