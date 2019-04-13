import {isBrowser} from '../../utils/globals';

// fetch-file-node is excluded from build under browser so don't do indivdual imports
import * as node from '../../node/fetch/fetch-file-node';

// Import individual symbols for browser version to ensure tree-shaking is enabled
import {
  fetchFile as browserFetchFile,
  readFileSync as browserReadFileSync,
  createReadStream as browserCreateReadStream
} from './fetch-file-browser';

import {resolvePath} from './file-aliases';

// Reads raw file data from:
// * http/http urls
// * data urls
// * File/Blob objects
// etc?
export async function fetchFile(url, options) {
  url = resolvePath(url);
  const func = isBrowser ? browserFetchFile : node.fetchFile;
  return func(url, options);
}

// In a few cases (data URIs, node.js) "files" can be read synchronously
export function readFileSync(url, options = {}) {
  url = resolvePath(url);
  const func = isBrowser ? browserReadFileSync : node.readFileSync;
  return func(url, options);
}

// DEPRECATED

// Returns a promise that resolves to a readable stream
export async function createReadStream(url, options) {
  url = resolvePath(url);
  const func = isBrowser ? browserCreateReadStream : node.createReadStream;
  return func(url, options);
}
