export {default as createWorker} from './lib/create-worker';

// GENERAL UTILS
export {default as assert} from './lib/env-utils/assert';
export {
  isBrowser,
  isWorker,
  nodeVersion,
  self,
  window,
  global,
  document
} from './lib/env-utils/globals';

// LIBRARY UTILS
export {getLibraryUrl, loadLibrary} from './lib/library-utils/library-utils';

// WORKER UTILS
export {getTransferList} from './lib/worker-utils/get-transfer-list';
export {validateLoaderVersion} from './lib/validate-loader-version';

// PARSER UTILS
export {parseJSON} from './lib/parser-utils/parse-json';

// MEMORY COPY UTILS
export {
  padTo4Bytes,
  copyToArray,
  copyArrayBuffer,
  getZeroOffsetArrayBuffer
} from './lib/binary-utils/memory-copy-utils';
export {
  copyPaddedArrayBufferToDataView,
  copyPaddedStringToDataView
} from './lib/binary-utils/binary-copy-utils';
export {
  padStringToByteAlignment,
  copyStringToDataView,
  copyBinaryToDataView
} from './lib/binary-utils/encode-utils';
export {getFirstCharacters, getMagicString} from './lib/binary-utils/get-first-characters';

// PATH UTILS

import * as path from './lib/path-utils/path';
export {path};
export {setPathPrefix, getPathPrefix, resolvePath} from './lib/path-utils/file-aliases';
export {addAliases as _addAliases} from './lib/path-utils/file-aliases.js';

// "JAVASCRIPT" UTILS
export {
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isFileReadable,
  isFetchResponse,
  isReadableStream,
  isWritableStream
} from './lib/javascript-utils/is-type';

// ITERATOR UTILS
export {makeStreamIterator} from './lib/iterator-utils/stream-iteration';

export {
  forEach,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  numberedLineAsyncIterator
} from './lib/iterator-utils/async-iteration';

export {makeChunkIterator, concatenateChunksAsync} from './lib/iterator-utils/chunk-iteration';

// deprecated
export {
  concatenateChunksAsync as contatenateAsyncIterator
} from './lib/iterator-utils/chunk-iteration';
export {makeStreamIterator as getStreamIterator} from './lib/iterator-utils/stream-iteration';

// REQUEST UTILS
export {default as RequestScheduler} from './lib/request-utils/request-scheduler';

// MESH CATEGORY UTILS
// Note: Should move to category specific module if code size increases
export {getMeshSize as _getMeshSize} from './categories/mesh/mesh-utils';
