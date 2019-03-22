import {isBrowser} from '../utils/globals';

// Import individual symbols for browser version to ensure tree-shaking is enabled
import {
  fetchFile as browserFetchFile,
  createReadStream as browserCreateReadStream,
  readFile as browserReadFile,
  readFileSync as browserReadFileSync
} from './fetch-file-browser';

// fetch-file-node is excluded from build under browser so don't do indivdual imports
import * as node from './fetch-file-node';

// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
export async function fetchFile(url, options) {
  const func = isBrowser ? browserFetchFile : node.fetchFile;
  return func(url, options);
}

// In a few cases (data URIs, node.js) "files" can be read synchronously
export function readFileSync(url, options = {}) {
  const func = isBrowser ? browserReadFileSync : node.readFileSync;
  return func(url, options);
}

// DEPRECATED

// Returns a promise that resolves to a readable stream
export async function createReadStream(url, options) {
  const func = isBrowser ? browserCreateReadStream : node.createReadStream;
  return func(url, options);
}
export async function readFile(url, options = {}) {
  const func = isBrowser ? browserReadFile : node.readFile;
  return func(url, options);
}
