// FILE PARSING AND LOADING

export {setPathPrefix, getPathPrefix, resolvePath} from './read-file/file-aliases.js';

export {readFile, readFileSync} from './read-file/read-file';
export {createReadStream} from './read-file/create-stream';

export {
  parseFile, parseFileSync, parseFileAsIterator, parseFileAsAsyncIterator
} from './parse-file/parse-file';
export {loadFile, loadFileSync} from './load-file/load-file';
export {loadImage} from './load-file/load-image';

// FILE ENCODING AND SAVING

export {encodeFile, encodeFileSync, encodeToStream} from './encode-file/encode-file';
export {writeFile, writeFileSync} from './write-file/write-file';
export {saveFile, saveFileSync} from './save-file/save-file';

// BINARY UTILS

export {
  TextDecoder,
  TextEncoder
} from './binary-utils/text-encoding';

export {
  isArrayBuffer,
  isBuffer,
  isBlob,
  toArrayBuffer,
  blobToArrayBuffer,
  toBuffer,
  toDataView
} from './binary-utils/binary-utils';

export {
  padTo4Bytes,
  copyToArray,
  copyArrayBuffer
} from './binary-utils/memory-copy-utils';

export {
  flattenToTypedArray
} from './binary-utils/flatten-to-typed-array';

// IMAGE UTILS

export {
  isImage,
  getImageSize
} from './image-utils/get-image-size';

export {
  ImageBitmapLoader,
  HTMLImageLoader,
  PlatformImageLoader
} from './image-utils/image-loaders';

// MESH UTILS

export {
  getAccessorTypeFromSize,
  getComponentTypeFromArray
} from './mesh-utils/gltf-type-utils';

export {
  getGLTFAttribute,
  getGLTFAccessors,
  getGLTFIndices,
  getGLTFAttributeMap
} from './mesh-utils/gltf-attribute-utils';

// CORE UTILS

export {default as assert} from './utils/assert';
export {isBrowser, self, window, global, document} from './utils/globals';

// WORKER UTILS

export {default as createWorker} from './worker-utils/create-worker';
export {default as _parseWithWorker} from './worker-utils/parse-with-worker';

export {
  isPromise, isIterable, isAsyncIterable,
  forEach,
  concatenateAsyncIterator,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  numberedLineAsyncIterator
} from './async-iterator-utils/async-iterator-utils';

export {
  getStreamIterator
} from './async-iterator-utils/stream-utils';

// INTERNAL UTILS
export {getMeshSize as _getMeshSize} from './mesh-utils/mesh-utils';
export {autoDetectLoader as _autoDetectLoader} from './parse-file/auto-detect-loader';
