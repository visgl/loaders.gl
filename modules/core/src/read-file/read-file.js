/* global fetch */
/* global URL, location, File, FileReader */
/* global Buffer */
import {resolvePath} from './file-aliases';
import decodeDataUri from '../data-uri-utils/decode-data-uri';
import {toArrayBuffer} from '../binary-utils/binary-utils';
import {concatenateReadStream} from '../async-iterator-utils/stream-utils';
import fs from 'fs'; // `fs` will be empty object in browsers (see package.json "browser" field).
import http from 'http';
import https from 'https';
import util from 'util';

const isNode = Boolean(fs && fs.readFile);

const DEFAULT_OPTIONS = {
  dataType: 'arrayBuffer'
};

function getReadFileOptions(options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  options.responseType = options.responseType || options.dataType;
  if (fs) {
    // set encoding for fs.readFile
    options.encoding = options.encoding || (options.dataType === 'text' ? 'utf8' : null);
  }
  return options;
}

// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
export function readFile(uri, options = {}) {
  try {
    uri = resolvePath(uri);
    options = getReadFileOptions(options);

    if (uri.startsWith('data:')) {
      return Promise.resolve(decodeDataUri(uri));
    }

    if (typeof File !== 'undefined' && uri instanceof File) {
      readFileObject(uri, options);
    }

    const isRequest = uri.startsWith('http:') || uri.startsWith('https:');

    if (isNode) {
      if (isRequest) {
        return new Promise((resolve, reject) => {
          options = {...new URL(uri), ...options};
          const request = uri.startsWith('https:') ? https.request : http.request;
          request(uri, response =>
            concatenateReadStream(response)
              .then(resolve, reject)
          );
        });
      }

      return readFileNode(uri, options);
    }

    // Browser: Try to load all URLS via fetch, as they can be local requests (e.g. to a dev server)
    if (typeof createImageBitmap === 'undefined') {
      // In a web worker: XMLHttpRequest throws invalid URL error if using relative path
      // resolve url relative to original base
      uri = new URL(uri, location.pathname).href;
    }
    return fetch(uri, options).then(res => res[options.dataType]());

    // return Promise.reject(new Error('Cannot load file URIs in browser'));
  } catch (error) {
    return Promise.reject(error.message);
  }
}

// In a few cases (data URIs, node.js) "files" can be read synchronously
export function readFileSync(uri, options = {}) {
  uri = resolvePath(uri);
  options = getReadFileOptions(options);

  if (uri.startsWith('data:')) {
    return decodeDataUri(uri);
  }

  if (!isNode) {
    return null; // throw new Error('Cant load URI synchronously');
  }

  const buffer = fs.readFileSync(uri, options, () => {});
  return buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer;
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

function readFileNode(filename, options) {
  const readFileAsync = util.promisify(fs.readFile);
  return readFileAsync(filename, options).then(
    buffer => buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer
  );
}

