// FILE READING AND WRITING
export {setPathPrefix, getPathPrefix, resolvePath} from './fetch-and-write/file-aliases.js';
export {fetchFile, readFileSync} from './fetch-and-write/fetch-file';
export {writeFile, writeFileSync} from './fetch-and-write/write-file';

// FILE PARSING AND ENCODING
export {registerLoaders} from './load-and-encode/register-loaders';
export {
  parseFile,
  parseFileSync,
  parseFileInBatches,
  parseFileInBatchesSync
} from './load-and-encode/parse-file';

// LOADING (READING + PARSING)
export {loadFileInBatches, loadFile, loadFileSync} from './load-and-encode/load-file';
export {loadImage} from './load-and-encode/load-image';
export {
  ImageBitmapLoader,
  HTMLImageLoader,
  PlatformImageLoader
} from './load-and-encode/image-loaders';

// ENCODING AND SAVING
export {encodeFile, encodeFileSync, encodeToStream} from './load-and-encode/encode-file';
export {saveFile, saveFileSync} from './load-and-encode/save-file';

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
export {createReadStream} from './fetch-and-write/fetch-file';
