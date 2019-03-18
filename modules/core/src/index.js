// FILE PARSING AND LOADING

export {setPathPrefix, getPathPrefix, resolvePath} from './read-file/file-aliases.js';

export {fetchFile, readFileSync} from './read-file/read-file';
export {
  parseFile,
  parseFileSync,
  parseFileInBatches,
  parseFileInBatchesSync
} from './parse-file/parse-file';

export {loadFileInBatches, loadFile, loadFileSync} from './load-file/load-file';
export {loadImage} from './load-file/load-image';

// FILE ENCODING AND SAVING

export {encodeFile, encodeFileSync, encodeToStream} from './encode-file/encode-file';
export {writeFile, writeFileSync} from './write-file/write-file';
export {saveFile, saveFileSync} from './save-file/save-file';

// TYPE UTILS

export {
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isFetchResponse,
  isReadableStream,
  isWritableStream
} from './utils/is-type';

// CORE UTILS

export {isBrowser, self, window, global, document} from './utils/globals';
export {default as assert} from './utils/assert';

// BINARY UTILS

export {
  isArrayBuffer,
  isBuffer,
  isBlob,
  toArrayBuffer,
  blobToArrayBuffer,
  toBuffer,
  toDataView
} from './binary-utils/binary-utils';

export {padTo4Bytes, copyToArray, copyArrayBuffer} from './binary-utils/memory-copy-utils';
export {flattenToTypedArray} from './binary-utils/flatten-to-typed-array';
export {TextDecoder, TextEncoder} from './binary-utils/text-encoding';

// WORKER UTILS

export {default as createWorker} from './worker-utils/create-worker';

// ITERATOR UTILS

export {
  forEach,
  concatenateAsyncIterator,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  numberedLineAsyncIterator
} from './iterator-utils/async-iterator-utils';

export {default as AsyncQueue} from './iterator-utils/async-queue';

export {getStreamIterator} from './iterator-utils/stream-utils';

// IMAGE UTILS

export {isImage, getImageSize} from './image-utils/get-image-size';

export {ImageBitmapLoader, HTMLImageLoader, PlatformImageLoader} from './image-utils/image-loaders';

// MESH CATEGORY UTILS

export {
  getAccessorTypeFromSize,
  getComponentTypeFromArray
} from './categories/mesh/gltf-type-utils';

export {
  getGLTFAttribute,
  getGLTFAccessors,
  getGLTFIndices,
  getGLTFAttributeMap
} from './categories/mesh/gltf-attribute-utils';

// TABLE CATEGORY UTILS

export {
  // convertTableToColumns,
  // convertTableToRows,
  deduceTableSchema
} from './categories/table/table-utils';

// INTERNAL UTILS
export {getMeshSize as _getMeshSize} from './categories/mesh/mesh-utils';

// DEPRECATED
export {readFile, createReadStream} from './read-file/read-file';
