// LOADING FUNCTIONS

export {loadFile} from './common/file-utils/loader';
export {loadBinaryFile} from './common/file-utils/load-binary-file';
export {smartFetch, smartParse} from './common/file-utils/smart-fetch';
export {saveBinaryFile} from './common/file-utils/load-binary-file';

export {loadUri} from './common/loader-utils/load-uri.js';

// UTILS

export {default as assert} from './common/loader-utils/assert';
export {flattenToTypedArray} from './common/loader-utils/flatten';
export {getImageSize} from './common/loader-utils/get-image-size';
export {padTo4Bytes, copyArrayBuffer} from './common/loader-utils/array-utils';
export {toArrayBuffer, toBuffer} from './common/loader-utils/binary-utils';
export {TextDecoder, TextEncoder} from './common/loader-utils/text-encoding';

export {getMeshSize as _getMeshSize} from './common/mesh-utils/mesh-utils';
export {getAccessorTypeFromSize, getComponentTypeFromArray} from './common/mesh-utils/gltf-type-utils';
export {
  getGLTFAccessors,
  getGLTFIndices,
  getGLTFAttributeMap
} from './common/mesh-utils/gltf-attribute-utils';

// GENERAL FORMAT LOADERS
export {default as JSONLoader} from './formats/json-loader/json-loader';
export {default as CSVLoader} from './formats/csv-loader/csv-loader';
export {default as XMLLoader} from './formats/xml-loader/xml-loader';
