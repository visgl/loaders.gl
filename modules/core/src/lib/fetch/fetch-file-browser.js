/* global fetch */
import assert from '../../utils/assert';

const DEFAULT_OPTIONS = {
  dataType: 'arrayBuffer',
  // TODO - this was mostly set to true to make test cases work
  nothrow: true
};

const isDataURL = url => url.startsWith('data:');
// const isFileURL = url => typeof File !== 'undefined' && url instanceof File;

// Returns a promise that resolves to a response object
export async function fetchFile(url, options) {
  return await fetch(url, options);

  // TODO - SUPPORT reading from `File` objects
  // if (typeof File !== 'undefined' && uri instanceof File) {
  //   readFileObject(uri, options);
  // }
}

// In a few cases (data URIs, files under Node) "files" can be read synchronously
export function readFileSync(uri, options = {}) {
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

// DEPRECATED

// Creates a readable stream to
// * http/http urls
// * data urls
// TODO - does not support opening a stream on a `File` objects
export async function createReadStream(url, options) {
  return fetch(url, options).then(res => res.body);
}

// HELPER FUNCTIONS

function getReadFileOptions(options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  options.responseType = options.responseType || options.dataType;
  return options;
}

/**
 * File reader function for the browser
 * @param {File|Blob} file  HTML File or Blob object to read as string
 * @returns {Promise.string}  Resolves to a string containing file contents
/* global File, FileReader
function readFileObject(file, options) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = error => reject(new Error(error));
      reader.onabort = () => reject(new Error('Read aborted.'));
      reader.onload = () => resolve(reader.result);
      if (options.dataType !== 'arraybuffer') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      reject(error);
    }
  });
}
*/

/* Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
async function readFile(uri, options = {}) {
  options = getReadFileOptions(options);

  // NOTE: data URLs are decoded by fetch

  // SUPPORT reading from `File` objects
  if (typeof File !== 'undefined' && uri instanceof File) {
    readFileObject(uri, options);
  }

  // In a web worker, XMLHttpRequest throws invalid URL error if using relative path
  // resolve url relative to original base
  // TODO - merge this into `resolvePath?
  uri = new URL(uri, location.href).href;

  // Browser: Try to load all URLS via fetch, as they can be local requests (e.g. to a dev server)
  const response = await fetch(uri, options);
  return response[options.dataType]();
}
*/
