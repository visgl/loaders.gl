// FILE LOADING FUNCTIONS

export {setPathPrefix, getPathPrefix} from './file-utils/path-prefix';
export {readFile, readFileSync} from './file-utils/read-file';
export {parseFile, parseFileSync} from './file-utils/parse-file';
export {loadFile, loadFileSync} from './file-utils/load-file';
export {loadImage} from './file-utils/load-image';

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

// MESH UTILS

export {
  getAccessorTypeFromSize,
  getComponentTypeFromArray
} from './mesh-utils/gltf-type-utils';

export {
  getGLTFAccessors,
  getGLTFIndices,
  getGLTFAttributeMap
} from './mesh-utils/gltf-attribute-utils';

export {getMeshSize as _getMeshSize} from './mesh-utils/mesh-utils';

// CORE UTILS

export {default as assert} from './utils/assert';
export {isBrowser, self, window, global, document} from './utils/globals';
