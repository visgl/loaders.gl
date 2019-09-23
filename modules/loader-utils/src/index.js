// WORKER UTILS
export {default as createWorker} from './worker-utils/create-worker';

// MEMORY COPY UTILS
export {
  padTo4Bytes,
  copyToArray,
  copyArrayBuffer,
  getZeroOffsetArrayBuffer
} from './lib/memory-copy-utils';
export {copyPaddedArrayBufferToDataView, copyPaddedStringToDataView} from './lib/binary-copy-utils';
export {
  padStringToByteAlignment,
  copyStringToDataView,
  copyBinaryToDataView
} from './lib/encode-utils';

export {getFirstCharacters, getMagicString} from './lib/get-first-characters';

export {parseJSON} from './lib/parse-json';

// MESH CATEGORY UTILS
export {getMeshSize as _getMeshSize} from './categories/mesh/mesh-utils';

export {default as assert} from './lib/utils/assert';
