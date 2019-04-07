// FILE READING AND WRITING
export {setPathPrefix, getPathPrefix, resolvePath} from './lib/fetch/file-aliases.js';
export {fetchFile, readFileSync} from './lib/fetch/fetch-file';
export {writeFile, writeFileSync} from './lib/fetch/write-file';

// FILE PARSING AND ENCODING
export {registerLoaders} from './lib/register-loaders';
export {parse, parseSync, parseInBatches, parseInBatchesSync} from './lib/parse';

// LOADING (READING + PARSING)
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
export {flattenToTypedArray} from './javascript-utils/flatten-to-typed-array';
export {TextDecoder, TextEncoder} from './javascript-utils/text-encoding';

// ITERATOR UTILS
export {getStreamIterator} from './javascript-utils/stream-utils';

export {
  forEach,
  concatenateAsyncIterator,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  numberedLineAsyncIterator
} from './javascript-utils/async-iterator-utils';

// WORKER UTILS
export {default as createWorker} from './worker-utils/create-worker';

// CORE UTILS
export {isBrowser, self, window, global, document} from './utils/globals';
export {default as assert} from './utils/assert';

// MESH CATEGORY UTILS
export {getMeshSize as _getMeshSize} from './categories/mesh/mesh-utils';

// DEPRECATED
export {loadImage} from './lib/load-image';

export {createReadStream} from './lib/fetch/fetch-file';

import {parse, parseSync} from './lib/parse';
import {load} from './lib/load';

export function parseFile(...args) {
  console.warn('parseFile() deprecated, use parse()'); // eslint-disable-line
  return parse(...args);
}

export function parseFileSync(...args) {
  console.warn('parseFileSync() deprecated, use parseSync()'); // eslint-disable-line
  return parseSync(...args);
}

export function loadFile(...args) {
  console.warn('loadFile() deprecated, use load()'); // eslint-disable-line
  return load(...args);
}
