import {getPathPrefix} from './path-prefix';
import decodeDataUri from '../loader-utils/decode-data-uri';
/* global fetch */
/* global URL, location */
/* global File, FileReader */

const DEFAULT_OPTIONS = {
  rootFolder: '.',
  dataType: 'arrayBuffer'
};

function getReadFileOptions(options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  options.responseType = options.responseType || options.dataType;
  return options;
}

// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
export function readFile(uri, options = {}) {
  options = getReadFileOptions(options);
  uri = getPathPrefix() + uri;

  if (uri.startsWith('http:') || uri.startsWith('https:')) {
    if (typeof createImageBitmap === 'undefined') {
      // In a web worker: XMLHttpRequest throws invalid URL error if using relative path
      // resolve url relative to original base
      uri = new URL(uri, location.pathname).href;
    }
    return fetch(uri, options).then(res => res[options.dataType]());
  }

  if (uri.startsWith('data:')) {
    return Promise.resolve(decodeDataUri(uri));
  }

  if (typeof File !== undefined && uri instanceof File) {
    readFileObject(uri, options);
  }

  return Promise.reject(new Error('Cannot load file URIs in browser'));
  // }

  // const filePath = path.join((rootFolder = '.'), uri);
  // return fs.readFileAsync(filePath).then(buffer => ({buffer}));
}

// In a few cases (data URIs, node.js) "files" can be read synchronously
export function readFileSync(uri, options = {}) {
  options = getReadFileOptions(options);
  uri = getPathPrefix() + uri;

  if (uri.startsWith('data:')) {
    return decodeDataUri(uri);
  }

  throw new Error('Cant load URI synchronously');
}

// HELPERS

/**
 * File reader function for the browser
 * @param {File|Blob} file  HTML File or Blob object to read as string
 * @returns {Promise.string}  Resolves to a string containing file contents
 */
function readFileObject(file, options) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = error => reject(new Error(error));
      reader.onabort = () => reject(new Error('Read operation was aborted.'));
      reader.onload = () => resolve(reader.result);
      // TODO - support binary?
      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
}
