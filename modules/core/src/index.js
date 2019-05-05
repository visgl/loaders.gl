import {parse, parseSync} from './lib/parse';
import {fetchFile} from './lib/fetch/fetch-file';
import {load} from './lib/load';
import {resolvePath} from './lib/fetch/file-aliases';
import {global} from './utils/globals';

// FILE READING AND WRITING
export {setPathPrefix, getPathPrefix, resolvePath} from './lib/fetch/file-aliases.js';
export {fetchFile} from './lib/fetch/fetch-file';
export {readFileSync} from './lib/fetch/read-file';
export {writeFile, writeFileSync} from './lib/fetch/write-file';

// FILE PARSING AND ENCODING
export {registerLoaders} from './lib/register-loaders';

// LOADING (READING + PARSING)
export {parse, parseSync, parseInBatches, parseInBatchesSync} from './lib/parse';
export {load, loadInBatches} from './lib/load';

// ENCODING AND SAVING
export {encode, encodeSync, encodeInBatches} from './lib/encode';
export {save, saveSync} from './lib/save';

// "JAVASCRIPT" UTILS
export {
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isFetchResponse,
  isReadableStream,
  isWritableStream
} from './javascript-utils/is-type';

export {
  isArrayBuffer,
  isBlob,
  toArrayBuffer,
  blobToArrayBuffer,
  toDataView
} from './javascript-utils/binary-utils';

export {padTo4Bytes, copyToArray, copyArrayBuffer} from './javascript-utils/memory-copy-utils';

// ITERATOR UTILS
export {getStreamIterator} from './javascript-utils/stream-utils';

export {
  forEach,
  concatenateAsyncIterator,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  numberedLineAsyncIterator
} from './javascript-utils/async-iterator-utils';

// CORE UTILS
export {isBrowser, self, window, global, document} from './utils/globals';
export {default as assert} from './utils/assert';

// DEPRECATED

// Use @loaders.gl/polyfills and global symbols instead
export const TextEncoder = global.TextEncoder;
export const TextDecoder = global.TextDecoder;

// Returns a promise that resolves to a readable stream
export async function createReadStream(url, options) {
  // eslint-disable-next-line
  console.warn('createReadStream() deprecated, use fetch().then(resp => resp.body)');
  url = resolvePath(url);
  const response = await fetchFile(url, options);
  return response.body;
}

export function parseFile(...args) {
  console.warn('parse() deprecated, use parse()'); // eslint-disable-line
  return parse(...args);
}

export function parseFileSync(...args) {
  console.warn('parseSync() deprecated, use parseSync()'); // eslint-disable-line
  return parseSync(...args);
}

export function loadFile(...args) {
  console.warn('loadFile() deprecated, use load()'); // eslint-disable-line
  return load(...args);
}
