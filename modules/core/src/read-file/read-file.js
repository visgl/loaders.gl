import {isBrowser} from '../utils/globals';

// Import individual symbols for browser version to ensure tree-shaking is enabled
import {
  fetchFile as browserFetchFile,
  createReadStream as browserCreateReadStream,
  readFile as browserReadFile,
  readFileSync as browserReadFileSync
} from './read-file-browser';

// read-file-node is excluded from build under browser so don't do indivdual imports
import node from './read-file-node';

export async function fetchFile(url, options) {
  const func = isBrowser ? browserFetchFile : node.fetchFile;
  return func(url, options);
}

// Returns a promise that resolves to a readable stream
export async function createReadStream(url, options) {
  const func = isBrowser ? browserCreateReadStream : node.createReadStream;
  return func(url, options);
}

// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
export async function readFile(url, options = {}) {
  const func = isBrowser ? browserReadFile : node.readFile;
  return func(url, options);
}

// In a few cases (data URIs, node.js) "files" can be read synchronously
export function readFileSync(url, options = {}) {
  const func = isBrowser ? browserReadFileSync : node.readFileSync;
  return func(url, options);
}
