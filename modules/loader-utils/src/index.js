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

// WORKER LOADER UTILS
export {default as createWorker} from './lib/worker-loader-utils/create-worker';
export {validateLoaderVersion} from './lib/worker-loader-utils/validate-loader-version';
export {makeTransformIterator} from './lib/iterator-utils/make-transform-iterator';

// WORKER UTILS
export {getTransferList} from './lib/worker-utils/get-transfer-list';
export {default as _WorkerFarm} from './lib/worker-utils/worker-farm';
export {default as _WorkerPool} from './lib/worker-utils/worker-pool';
export {default as _WorkerThread} from './lib/worker-utils/worker-thread';

// LIBRARY UTILS
export {getLibraryUrl, loadLibrary} from './lib/library-utils/library-utils';

// PARSER UTILS
export {parseJSON} from './lib/parser-utils/parse-json';

// MEMORY COPY UTILS
export {isBuffer, toBuffer, bufferToArrayBuffer} from './lib/binary-utils/buffer-utils';
export {
  toArrayBuffer,
  sliceArrayBuffer,
  concatenateArrayBuffers,
  compareArrayBuffers
} from './lib/binary-utils/array-buffer-utils';
export {padTo4Bytes, copyToArray, copyArrayBuffer} from './lib/binary-utils/memory-copy-utils';
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

// ITERATOR UTILS

export {
  makeTextEncoderIterator,
  makeTextDecoderIterator,
  makeLineIterator,
  makeNumberedLineIterator
} from './lib/iterator-utils/text-iterators';
export {forEach, concatenateChunksAsync} from './lib/iterator-utils/async-iteration';

// REQUEST UTILS
export {default as RequestScheduler} from './lib/request-utils/request-scheduler';

// MESH CATEGORY UTILS
// Note: Should move to category specific module if code size increases
export {getMeshSize as _getMeshSize, getMeshBoundingBox} from './categories/mesh/mesh-utils';

// DEPRECATED IN 2.3
export {getZeroOffsetArrayBuffer} from './lib/binary-utils/memory-copy-utils';
