// FILE LOADING FUNCTIONS

export {setPathPrefix, getPathPrefix} from './read-file/path-prefix';
export {addFileAliases} from './read-file/file-aliases';
export {readFile, readFileSync} from './read-file/read-file';
export {parseFile, parseFileSync} from './parse-file/parse-file';
export {loadFile, loadFileSync} from './load-file/load-file';
export {loadImage} from './load-file/load-image';

// BINARY UTILS

export {
  copyToArray,
  toArrayBuffer,
  toBuffer,
  toDataView
} from './binary-utils/binary-utils';

export {
  TextDecoder,
  TextEncoder
} from './binary-utils/text-encoding';

export {
  padTo4Bytes,
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
  decodeImage
} from './image-utils/image-utils-browser';

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

export {getMeshSize as _getMeshSize} from './mesh-utils/mesh-utils';

// CORE UTILS

export {default as assert} from './utils/assert';
export {isBrowser, self, window, global, document} from './utils/globals';

// WORKER UTILS

export {default as createWorker} from './worker-utils/create-worker';
export {default as _parseWithWorker} from './worker-utils/parse-with-worker';
