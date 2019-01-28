// FILE LOADING FUNCTIONS

export {setPathPrefix, getPathPrefix} from './file-utils/path-prefix';
export {readFileAsync as readFile, readFileSync} from './file-utils/read-file';
export {loadFileAsync as loadFile, loadFileSync} from './file-utils/load-file';
export {loadImage} from './file-utils/load-image';

// DEPRECATED
export {default as readDataUri} from './loader-utils/decode-data-uri.js';
export {smartFetch, smartParse} from './deprecated/smart-fetch';

// BINARY UTILS

export {
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
