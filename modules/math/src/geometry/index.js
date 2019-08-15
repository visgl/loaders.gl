export {GL} from './constants';

// GL support
export {GL_TYPE} from './constants';
export {default as GLType} from './gl/gl-type';

// Geometry
export {default as isGeometry} from './is-geometry';

// Iterators
export {default as attributeIterator} from './iterators/attribute-iterator';
export {default as primitiveIterator} from './iterators/primitive-iterator';

// Helper methods
export {default as computeVertexNormals} from './attributes/compute-vertex-normals';

export {encodeRGB565, decodeRGB565} from './colors/rgb565';

// Typed array utils
export {concatTypedArrays} from './typed-arrays/typed-array-utils';

// Compression
export {
  octEncodeInRange,
  octEncode,
  octEncodeToVector4,
  octDecodeInRange,
  octDecode,
  octDecodeFromVector4,
  octPackFloat,
  octEncodeFloat,
  octDecodeFloat,
  octPack,
  octUnpack,
  compressTextureCoordinates,
  decompressTextureCoordinates,
  zigZagDeltaDecode
} from './compression/attribute-compression';
