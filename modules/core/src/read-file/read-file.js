/* global fetch */
/* global URL, location, File, FileReader */
/* global Buffer */
import {getPathPrefix} from './path-prefix';
import {getFileAlias} from './file-aliases';
import decodeDataUri from '../data-uri-utils/decode-data-uri';
import {toArrayBuffer} from '../binary-utils/binary-utils';
import fs from 'fs'; // `fs` will be `false` in browsers (see package.json "browser" field).
import http from 'http'; // `http` will be `false` in browsers (see package.json "browser" field).
import util from 'util';

const isNode = Boolean(fs && fs.readFile);

const DEFAULT_OPTIONS = {
  dataType: 'arraybuffer'
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
    options = getReadFileOptions(options);
    uri = getPathPrefix() + uri;

    const alias = getFileAlias(uri);
    if (alias) {
      return Promise.resolve(alias);
    }

    if (uri.startsWith('data:')) {
      return Promise.resolve(decodeDataUri(uri));
    }

    if (typeof File !== 'undefined' && uri instanceof File) {
      readFileObject(uri, options);
    }

    const isRequest = uri.startsWith('http:') || uri.startsWith('https:');
    if (isRequest) {
      if (isNode) {
        return http.request(uri, options);
      }
      if (typeof createImageBitmap === 'undefined') {
        // In a web worker: XMLHttpRequest throws invalid URL error if using relative path
        // resolve url relative to original base
        uri = new URL(uri, location.pathname).href;
      }
      return fetch(uri, options).then(res => res[options.dataType]());
    }

    if (isNode) {
      return readFileNode(uri, options);
    }

    return Promise.reject(new Error('Cannot load file URIs in browser'));
  } catch (error) {
    return Promise.reject(error.message);
  }
}

// In a few cases (data URIs, node.js) "files" can be read synchronously
export function readFileSync(uri, options = {}) {
  options = getReadFileOptions(options);
  uri = getPathPrefix() + uri;

  const alias = getFileAlias(uri);
  if (alias) {
    return alias;
  }

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
  return readFileAsync(filename, options, () => {}).then(
    buffer => buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer
  );
}

